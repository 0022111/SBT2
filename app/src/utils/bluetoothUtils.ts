export const convertBLEToUint16 = (bleBuffer: DataView): number => {
  if (bleBuffer.byteLength === 0) return 0;
  if (bleBuffer.byteLength === 1) return bleBuffer.getUint8(0);
  return bleBuffer.getUint16(0, true);
};

export const convertCelsiusToFahrenheit = (celsius: number): number =>
  Math.round(celsius * 1.8 + 32);

export const convertFahrenheitToCelsius = (fahrenheit: number): number =>
  Math.round((fahrenheit - 32) / 1.8);

export const convertToUInt8BLE = (value: number): ArrayBuffer => {
  const buffer = new ArrayBuffer(1);
  new DataView(buffer).setUint8(0, value % 256);
  return buffer;
};

export const convertToUInt16BLE = (value: number): ArrayBuffer => {
  const buffer = new ArrayBuffer(2);
  new DataView(buffer).setUint16(0, value, true);
  return buffer;
};

export const convertToUInt32BLE = (value: number): ArrayBuffer => {
  const buffer = new ArrayBuffer(4);
  new DataView(buffer).setUint32(0, value, true);
  return buffer;
};
