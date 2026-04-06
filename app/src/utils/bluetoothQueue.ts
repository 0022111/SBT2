import PQueue from "p-queue";

/**
 * Global Bluetooth queue to ensure all BLE operations are serialized.
 * Prevents race conditions — only one BLE operation at a time.
 */
export const bluetoothQueue = new PQueue({ concurrency: 1 });
