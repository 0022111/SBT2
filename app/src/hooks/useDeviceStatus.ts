import { useState, useEffect, useCallback, useRef } from "react";
import { useBluetooth } from "../providers/BluetoothProvider";
import { bluetoothQueue } from "../utils/bluetoothQueue";
import { ConnectionState } from "../utils/uuids";
import { savePersistedData } from "../utils/storage";

export interface DeviceStatus {
  targetTemp: number | null;
  boostTemp: number | null;
  superBoostTemp: number | null;
  batteryLevel: number | null;
  autoShutdownTimer: number | null;
  heaterMode: number | null;
  isHeating: boolean;
  isCharging: boolean;
  isCelsius: boolean;
  setpointReached: boolean;
  vibration: boolean;
  chargeCurrentOptimization: boolean;
  chargeVoltageLimit: boolean;
  permanentBluetooth: boolean;
  boostVisualization: boolean;
}

export function useDeviceStatus(pollInterval = 500) {
  const { characteristics, deviceInfo, connectionState } = useBluetooth();
  const [status, setStatus] = useState<DeviceStatus | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const parseDeviceStatus = useCallback(
    (value: DataView): DeviceStatus | null => {
      if (value.byteLength < 15) return null;

      const byte4 = value.getUint8(4);
      const byte5 = value.getUint8(5);
      const targetTemp = Math.round((byte4 + byte5 * 256) / 10);
      const settings = value.getUint8(14);
      const heaterModeValue = value.getUint8(11);
      const chargerConnected = value.getUint8(13);
      const autoShutdownTimer = value.getUint8(9) + value.getUint8(10);
      const permanentBluetooth =
        value.byteLength > 16 ? !!(value.getUint8(16) & 0x01) : false;
      const boostVisualization =
        deviceInfo.type === "VEAZY"
          ? !(settings & 0x40)
          : !!(settings & 0x40);

      const batteryLevel = value.getUint8(8);

      // Latch battery to localStorage
      savePersistedData({
        lastBatteryLevel: batteryLevel,
        lastBatteryTimestamp: Date.now(),
        lastTargetTemp: targetTemp,
      });

      return {
        targetTemp,
        boostTemp: value.getUint8(6),
        superBoostTemp: value.getUint8(7),
        batteryLevel,
        autoShutdownTimer,
        heaterMode: heaterModeValue,
        isHeating: heaterModeValue > 0,
        isCharging: chargerConnected > 0,
        isCelsius: !(settings & 0x01),
        setpointReached: !!(settings & 0x02),
        vibration: !!(settings & 0x40),
        chargeCurrentOptimization: !!(settings & 0x08),
        chargeVoltageLimit: !!(settings & 0x20),
        permanentBluetooth,
        boostVisualization,
      };
    },
    [deviceInfo.type]
  );

  const requestStatus = useCallback(async () => {
    const control = characteristics.control;
    if (!control) return;
    const buffer = new ArrayBuffer(20);
    new DataView(buffer).setUint8(0, 1);
    try {
      await bluetoothQueue.add(() => control.writeValue(buffer));
    } catch {
      // Device may have disconnected
    }
  }, [characteristics.control]);

  const handleStatus = useCallback(
    (event: Event) => {
      const value = (event.target as BluetoothRemoteGATTCharacteristic).value;
      if (value && value.getUint8(0) === 1) {
        const parsed = parseDeviceStatus(value);
        if (parsed) setStatus(parsed);
      }
    },
    [parseDeviceStatus]
  );

  // Write helpers
  const writeDeviceStatus = useCallback(
    async (cmd: number, mask: number, byteMap: Record<number, number>) => {
      const buffer = new ArrayBuffer(20);
      const dv = new DataView(buffer);
      dv.setUint8(0, cmd);
      dv.setUint8(1, mask);
      for (const [byte, value] of Object.entries(byteMap)) {
        dv.setUint8(Number(byte), value);
      }
      const control = characteristics.control;
      if (control) await bluetoothQueue.add(() => control.writeValue(buffer));
    },
    [characteristics.control]
  );

  const setTargetTemp = useCallback(
    async (val: number) => {
      setStatus((prev) => (prev ? { ...prev, targetTemp: val } : prev));
      const t = val * 10;
      await writeDeviceStatus(1, 2, { 4: t & 0xff, 5: (t >> 8) & 0xff });
    },
    [writeDeviceStatus]
  );

  const setBoostTemp = useCallback(
    async (val: number) => {
      setStatus((prev) => (prev ? { ...prev, boostTemp: val } : prev));
      await writeDeviceStatus(1, 4, { 6: val });
    },
    [writeDeviceStatus]
  );

  const setSuperBoostTemp = useCallback(
    async (val: number) => {
      setStatus((prev) => (prev ? { ...prev, superBoostTemp: val } : prev));
      await writeDeviceStatus(1, 8, { 7: val });
    },
    [writeDeviceStatus]
  );

  const setHeaterMode = useCallback(
    async (mode: number) => {
      setStatus((prev) =>
        prev
          ? { ...prev, heaterMode: mode, isHeating: mode > 0 }
          : prev
      );
      await writeDeviceStatus(1, 32, { 11: mode });
    },
    [writeDeviceStatus]
  );

  const setIsCelsius = useCallback(
    async (val: boolean) => {
      setStatus((prev) => (prev ? { ...prev, isCelsius: val } : prev));
      await writeDeviceStatus(1, 128, { 14: val ? 0 : 1, 15: 1 });
    },
    [writeDeviceStatus]
  );

  const setAutoShutdownTimer = useCallback(
    async (val: number) => {
      setStatus((prev) =>
        prev ? { ...prev, autoShutdownTimer: val } : prev
      );
      await writeDeviceStatus(1, 16, {
        9: val & 0xff,
        10: (val >> 8) & 0xff,
      });
    },
    [writeDeviceStatus]
  );

  const setChargeCurrentOptimization = useCallback(
    async (val: boolean) => {
      setStatus((prev) =>
        prev ? { ...prev, chargeCurrentOptimization: val } : prev
      );
      await writeDeviceStatus(1, 128, { 14: val ? 0x08 : 0x00, 15: 8 });
    },
    [writeDeviceStatus]
  );

  const setChargeVoltageLimit = useCallback(
    async (val: boolean) => {
      setStatus((prev) =>
        prev ? { ...prev, chargeVoltageLimit: val } : prev
      );
      await writeDeviceStatus(1, 128, { 14: val ? 0x20 : 0x00, 15: 32 });
    },
    [writeDeviceStatus]
  );

  const setPermanentBluetooth = useCallback(
    async (val: boolean) => {
      setStatus((prev) =>
        prev ? { ...prev, permanentBluetooth: val } : prev
      );
      await writeDeviceStatus(1, 128, { 16: val ? 0x01 : 0x00, 17: 1 });
    },
    [writeDeviceStatus]
  );

  // Set up polling and event listener
  useEffect(() => {
    const control = characteristics.control;
    if (!control || connectionState !== ConnectionState.CONNECTED) return;

    control.addEventListener("characteristicvaluechanged", handleStatus);
    intervalRef.current = setInterval(requestStatus, pollInterval);

    return () => {
      control.removeEventListener("characteristicvaluechanged", handleStatus);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [
    characteristics.control,
    connectionState,
    handleStatus,
    requestStatus,
    pollInterval,
  ]);

  // Computed display values
  const convertToF = (c: number) => Math.round(c * 1.8 + 32);
  const isCelsius = status?.isCelsius ?? true;

  const displayTargetTemp = status?.targetTemp
    ? isCelsius
      ? status.targetTemp
      : convertToF(status.targetTemp)
    : 0;

  const effectiveTemp = (() => {
    if (!status) return 0;
    const target = status.targetTemp ?? 0;
    const boost = status.boostTemp ?? 0;
    const superboost = status.superBoostTemp ?? 0;
    let effective = target;
    if (status.heaterMode === 2) effective = target + boost;
    else if (status.heaterMode === 3) effective = target + superboost;
    return isCelsius ? effective : convertToF(effective);
  })();

  return {
    status,
    displayTargetTemp,
    effectiveTemp,
    setTargetTemp,
    setBoostTemp,
    setSuperBoostTemp,
    setHeaterMode,
    setIsCelsius,
    setAutoShutdownTimer,
    setChargeCurrentOptimization,
    setChargeVoltageLimit,
    setPermanentBluetooth,
  };
}
