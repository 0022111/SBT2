import { bluetoothQueue } from "./bluetoothQueue";

export const attachEventListener = async (
  characteristic: BluetoothRemoteGATTCharacteristic,
  handleValue: (value: DataView) => void
) => {
  const c = await characteristic.startNotifications();
  c.addEventListener("characteristicvaluechanged", (event) =>
    eventHandler(event, handleValue)
  );
  return c;
};

export const detachEventListener = async (
  characteristic: BluetoothRemoteGATTCharacteristic,
  handleValue: (value: DataView) => void
) => {
  characteristic.removeEventListener("characteristicvaluechanged", (event) =>
    eventHandler(event, handleValue)
  );
  await characteristic.stopNotifications();
};

export const getCharacteristic = async (
  service: BluetoothRemoteGATTService,
  characteristicUUID: string
) =>
  bluetoothQueue.add(async () => {
    if (!service.device.gatt?.connected) return null;
    return await service.getCharacteristic(characteristicUUID);
  });

export const createCharacteristicWithEventListener = async (
  service: BluetoothRemoteGATTService,
  characteristicUUID: string,
  handleValue: (value: DataView) => void
) => {
  const characteristic = await getCharacteristic(service, characteristicUUID);
  if (!characteristic) return;
  const value = await characteristic.readValue();
  handleValue(value);
  return attachEventListener(characteristic, handleValue);
};

export const createCharacteristic = async (
  service: BluetoothRemoteGATTService,
  characteristicUUID: string,
  handleValue: (value: DataView) => void
) => {
  const characteristic = await getCharacteristic(service, characteristicUUID);
  if (!characteristic) return;
  const value = await characteristic.readValue();
  handleValue(value);
  return characteristic;
};

const eventHandler = (
  event: Event,
  handleValue: (value: DataView) => void
) => {
  const value = (event.target as BluetoothRemoteGATTCharacteristic).value;
  if (value) handleValue(value);
};
