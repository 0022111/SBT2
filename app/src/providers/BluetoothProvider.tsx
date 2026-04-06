import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from "react";
import {
  ConnectionState,
  DeviceType,
  ServiceUUIDs,
  VentyVeazyCharacteristicUUIDs,
} from "../utils/uuids";
import { bluetoothQueue } from "../utils/bluetoothQueue";
import { savePersistedData } from "../utils/storage";

export type DeviceInfo = {
  type: DeviceType;
  name: string;
  serialNumber?: string;
  firmwareVersion?: string;
};

type DeviceCharacteristics = Record<
  string,
  BluetoothRemoteGATTCharacteristic | undefined
>;

interface BluetoothContextValue {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  connectionState: ConnectionState;
  deviceInfo: DeviceInfo;
  characteristics: DeviceCharacteristics;
  services: {
    volcanoState?: BluetoothRemoteGATTService;
    volcanoControl?: BluetoothRemoteGATTService;
    ventyVeazy?: BluetoothRemoteGATTService;
    crafty1?: BluetoothRemoteGATTService;
    crafty2?: BluetoothRemoteGATTService;
    crafty3?: BluetoothRemoteGATTService;
  };
}

const BluetoothContext = createContext<BluetoothContextValue | null>(null);

const detectDeviceType = (name: string): DeviceType => {
  if (name.includes("S&B VOLCANO")) return DeviceType.VOLCANO;
  if (name.includes("S&B VY")) return DeviceType.VENTY;
  if (name.includes("S&B VZ")) return DeviceType.VEAZY;
  if (name.includes("S&B") || name.includes("STORZ")) return DeviceType.CRAFTY;
  return DeviceType.UNKNOWN;
};

const isIOS = () =>
  navigator.userAgent.includes("iPhone") ||
  navigator.userAgent.includes("iPad") ||
  navigator.userAgent.includes("WebBLE/1");

export function BluetoothProvider({ children }: { children: React.ReactNode }) {
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    ConnectionState.NOT_CONNECTED
  );
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    type: DeviceType.UNKNOWN,
    name: "",
  });
  const [characteristics, setCharacteristics] = useState<DeviceCharacteristics>(
    {}
  );
  const [services, setServices] = useState<BluetoothContextValue["services"]>(
    {}
  );

  const deviceRef = useRef<BluetoothDevice | null>(null);
  const serverRef = useRef<BluetoothRemoteGATTServer | null>(null);

  const resetState = useCallback(() => {
    setConnectionState(ConnectionState.NOT_CONNECTED);
    setDeviceInfo({ type: DeviceType.UNKNOWN, name: "" });
    setCharacteristics({});
    setServices({});
    serverRef.current = null;
    deviceRef.current = null;
  }, []);

  const handleDisconnect = useCallback(() => {
    console.log("Device disconnected");
    resetState();
  }, [resetState]);

  const connectToVeazyVenty = useCallback(
    async (server: BluetoothRemoteGATTServer) => {
      const primaryService = await server.getPrimaryService(
        ServiceUUIDs.Primary
      );
      setServices((s) => ({ ...s, ventyVeazy: primaryService }));

      const controlChar = await primaryService.getCharacteristic(
        VentyVeazyCharacteristicUUIDs.control
      );
      await controlChar.startNotifications();

      // Initialization sequence: 0x02, 0x1D, 0x01, 0x04
      await bluetoothQueue.add(async () => {
        for (const cmd of [0x02, 0x1d, 0x01, 0x04]) {
          const buf = new ArrayBuffer(20);
          new DataView(buf).setUint8(0, cmd);
          await controlChar.writeValue(buf);
        }
      });

      setCharacteristics({ control: controlChar });
    },
    []
  );

  const connectToVolcano = useCallback(
    async (server: BluetoothRemoteGATTServer) => {
      const stateService = await server.getPrimaryService(
        ServiceUUIDs.DeviceState
      );
      const controlService = await server.getPrimaryService(
        ServiceUUIDs.DeviceControl
      );
      setServices((s) => ({
        ...s,
        volcanoState: stateService,
        volcanoControl: controlService,
      }));
    },
    []
  );

  const connectToCrafty = useCallback(
    async (server: BluetoothRemoteGATTServer) => {
      const s1 = await server.getPrimaryService(ServiceUUIDs.Crafty1);
      const s2 = await server.getPrimaryService(ServiceUUIDs.Crafty2);
      const s3 = await server.getPrimaryService(ServiceUUIDs.Crafty3);
      setServices((s) => ({ ...s, crafty1: s1, crafty2: s2, crafty3: s3 }));
    },
    []
  );

  const connect = useCallback(async () => {
    setConnectionState(ConnectionState.CONNECTING);
    try {
      const filters = isIOS()
        ? [
            { namePrefix: "STORZ&BICKEL" },
            { namePrefix: "Storz&Bickel" },
            { namePrefix: "S&B" },
          ]
        : [
            { namePrefix: "STORZ&BICKEL" },
            { namePrefix: "Storz&Bickel" },
            { namePrefix: "S&B" },
            {
              services: [
                ServiceUUIDs.Crafty1,
                ServiceUUIDs.Crafty2,
                ServiceUUIDs.Crafty3,
              ],
            },
            {
              services: [ServiceUUIDs.DeviceState, ServiceUUIDs.DeviceControl],
            },
            { services: [ServiceUUIDs.Primary] },
          ];

      const device = await navigator.bluetooth.requestDevice({
        filters,
        acceptAllDevices: false,
        optionalServices: ["generic_access", ServiceUUIDs.GenericAccess],
      });

      if (!device.gatt) throw new Error("Device does not support GATT");

      deviceRef.current = device;
      device.addEventListener("gattserverdisconnected", handleDisconnect);

      const name = device.name || "";
      const type = detectDeviceType(name);
      setDeviceInfo({ type, name });

      // Persist for latching
      savePersistedData({ lastDeviceName: name, lastDeviceType: type });

      const server = await device.gatt.connect();
      serverRef.current = server;

      if (type === DeviceType.VEAZY || type === DeviceType.VENTY) {
        await connectToVeazyVenty(server);
      } else if (type === DeviceType.CRAFTY) {
        await connectToCrafty(server);
      } else {
        await connectToVolcano(server);
      }

      setConnectionState(ConnectionState.CONNECTED);
    } catch (error) {
      console.error("Connection failed:", error);
      setConnectionState(ConnectionState.CONNECTION_FAILED);
      if (deviceRef.current) {
        deviceRef.current.removeEventListener(
          "gattserverdisconnected",
          handleDisconnect
        );
        deviceRef.current = null;
      }
    }
  }, [
    handleDisconnect,
    connectToVeazyVenty,
    connectToVolcano,
    connectToCrafty,
  ]);

  const disconnect = useCallback(async () => {
    if (characteristics.control) {
      try {
        await characteristics.control.stopNotifications();
      } catch (e) {
        console.error("Error stopping notifications:", e);
      }
    }
    if (deviceRef.current) {
      deviceRef.current.removeEventListener(
        "gattserverdisconnected",
        handleDisconnect
      );
    }
    if (serverRef.current) {
      try {
        serverRef.current.disconnect();
      } catch (e) {
        console.error("Error disconnecting:", e);
      }
    }
    resetState();
  }, [characteristics, handleDisconnect, resetState]);

  return (
    <BluetoothContext.Provider
      value={{
        connect,
        disconnect,
        connectionState,
        deviceInfo,
        characteristics,
        services,
      }}
    >
      {children}
    </BluetoothContext.Provider>
  );
}

export function useBluetooth() {
  const ctx = useContext(BluetoothContext);
  if (!ctx)
    throw new Error("useBluetooth must be used within BluetoothProvider");
  return ctx;
}
