import { useBluetooth } from "../providers/BluetoothProvider";
import { ConnectionState } from "../utils/uuids";
import { loadPersistedData } from "../utils/storage";
import "./ConnectScreen.css";

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/* Inline SVG icons to avoid any icon library dependency */
function BluetoothIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.5 6.5l11 11L12 23V1l5.5 5.5-11 11" />
    </svg>
  );
}

function BatteryIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="6" width="18" height="12" rx="2" />
      <line x1="23" y1="10" x2="23" y2="14" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

export function ConnectScreen() {
  const { connect, connectionState } = useBluetooth();
  const persisted = loadPersistedData();
  const isConnecting = connectionState === ConnectionState.CONNECTING;
  const isFailed = connectionState === ConnectionState.CONNECTION_FAILED;

  return (
    <div className="connect-screen">
      {/* Brand */}
      <div className="connect-screen__brand">
        <span className="connect-screen__logo">SBT2</span>
        <span className="connect-screen__tagline">Device Controller</span>
      </div>

      {/* Last connected device */}
      {persisted.lastDeviceName && (
        <div className="glass-card connect-screen__last-device">
          <div className="connect-screen__last-label">Last connected</div>
          <div className="connect-screen__last-name">{persisted.lastDeviceName}</div>
          {persisted.lastBatteryLevel != null && (
            <span className="pill">
              <BatteryIcon />
              {persisted.lastBatteryLevel}%
              {persisted.lastBatteryTimestamp
                ? ` · ${formatTimeAgo(persisted.lastBatteryTimestamp)}`
                : ""}
            </span>
          )}
        </div>
      )}

      {/* Connect button */}
      <button
        className="btn btn--primary connect-screen__connect-btn"
        onClick={connect}
        disabled={isConnecting}
      >
        {isConnecting ? (
          <>
            <span className="connect-screen__spinner" />
            Connecting…
          </>
        ) : (
          <>
            <BluetoothIcon className="connect-screen__bt-icon" />
            Connect Device
          </>
        )}
      </button>

      {/* Connection failed */}
      {isFailed && (
        <div className="connect-screen__error">
          <AlertIcon />
          <span>Connection failed. Make sure your device is on and nearby.</span>
        </div>
      )}

      {/* Browser support warning */}
      {!navigator.bluetooth && (
        <div className="connect-screen__warning">
          Web Bluetooth is not supported in this browser. Use Chrome on Android or desktop.
        </div>
      )}
    </div>
  );
}
