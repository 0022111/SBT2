import { useBluetooth } from "../providers/BluetoothProvider";
import { ConnectionState } from "../utils/uuids";
import { loadPersistedData } from "../utils/storage";
import { CyberWireframeHead } from "./CyberWireframeHead";
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

/* CyberHead wrapper — orbital rings + 3D Three.js canvas */
function CyberHead() {
  return (
    <div className="cyber-head">
      {/* Orbital rings */}
      <div className="cyber-head__orbital-wrap">
        <div className="cyber-head__ring cyber-head__ring--1">
          <div className="cyber-head__ring-node" />
        </div>
        <div className="cyber-head__ring cyber-head__ring--2">
          <div className="cyber-head__ring-node cyber-head__ring-node--2" />
        </div>
        <div className="cyber-head__ring cyber-head__ring--3">
          <div className="cyber-head__ring-node cyber-head__ring-node--3" />
        </div>
      </div>

      {/* 3D wireframe head */}
      <CyberWireframeHead />
    </div>
  );
}

/* ── Icons ── */
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

/* ── Main Component ── */
export function ConnectScreen() {
  const { connect, connectionState } = useBluetooth();
  const persisted = loadPersistedData();
  const isConnecting = connectionState === ConnectionState.CONNECTING;
  const isFailed = connectionState === ConnectionState.CONNECTION_FAILED;

  return (
    <div className="connect-screen">
      {/* Matrix grid background */}
      <div className="connect-screen__grid" />

      {/* Corner HUD decorations */}
      <div className="connect-screen__hud-tl" />
      <div className="connect-screen__hud-tr" />
      <div className="connect-screen__hud-bl" />
      <div className="connect-screen__hud-br" />

      {/* Data stream left side */}
      <div className="connect-screen__data-stream">
        {Array.from({ length: 30 }).map((_, i) => (
          <div key={i} className="connect-screen__data-line">
            {Math.random().toString(16).slice(2, 10).toUpperCase()}
          </div>
        ))}
      </div>

      {/* Logo */}
      <div className="connect-screen__brand">
        <div className="connect-screen__logo-wrap">
          <span className="connect-screen__logo">SBT2</span>
          <span className="connect-screen__logo-glitch" aria-hidden>SBT2</span>
        </div>
        <span className="connect-screen__tagline">
          <span className="connect-screen__tagline-cursor">▋</span>
          DEVICE CONTROLLER v2.0
        </span>
      </div>

      {/* Cyber head */}
      <CyberHead />

      {/* System status lines */}
      <div className="connect-screen__status-lines">
        <div className="connect-screen__status-line">
          <span className="connect-screen__status-key">SYS</span>
          <span className="connect-screen__status-val connect-screen__status-val--ok">ONLINE</span>
        </div>
        <div className="connect-screen__status-line">
          <span className="connect-screen__status-key">BLE</span>
          <span className={`connect-screen__status-val ${isConnecting ? "connect-screen__status-val--busy" : isFailed ? "connect-screen__status-val--err" : "connect-screen__status-val--ok"}`}>
            {isConnecting ? "SCANNING…" : isFailed ? "FAILED" : "READY"}
          </span>
        </div>
        <div className="connect-screen__status-line">
          <span className="connect-screen__status-key">WEB</span>
          <span className={`connect-screen__status-val ${navigator.bluetooth ? "connect-screen__status-val--ok" : "connect-screen__status-val--err"}`}>
            {navigator.bluetooth ? "BT SUPPORTED" : "BT UNSUPPORTED"}
          </span>
        </div>
      </div>

      {/* Last connected device */}
      {persisted.lastDeviceName && (
        <div className="glass-card connect-screen__last-device">
          <div className="connect-screen__last-label">// LAST SESSION</div>
          <div className="connect-screen__last-name">{persisted.lastDeviceName}</div>
          {persisted.lastBatteryLevel != null && (
            <span className="pill">
              <BatteryIcon />
              {persisted.lastBatteryLevel}%
              {persisted.lastBatteryTimestamp
                ? ` :: ${formatTimeAgo(persisted.lastBatteryTimestamp)}`
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
            INITIALIZING…
          </>
        ) : (
          <>
            <BluetoothIcon className="connect-screen__bt-icon" />
            CONNECT DEVICE
          </>
        )}
      </button>

      {/* Error */}
      {isFailed && (
        <div className="connect-screen__error">
          <AlertIcon />
          <span>// ERROR: Connection failed. Device offline or out of range.</span>
        </div>
      )}

      {/* Browser warning */}
      {!navigator.bluetooth && (
        <div className="connect-screen__warning">
          ⚠ Web Bluetooth unavailable. Use Chrome on Android or desktop.
        </div>
      )}
    </div>
  );
}
