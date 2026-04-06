const STORAGE_KEY = "sbt2";

export interface PersistedDeviceData {
  lastDeviceName?: string;
  lastDeviceType?: string;
  lastBatteryLevel?: number;
  lastBatteryTimestamp?: number;
  lastTargetTemp?: number;
}

export function loadPersistedData(): PersistedDeviceData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function savePersistedData(data: Partial<PersistedDeviceData>) {
  const existing = loadPersistedData();
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...existing, ...data }));
}
