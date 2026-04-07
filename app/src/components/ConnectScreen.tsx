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

/* ── Floating 3D Cyber Head ─────────────────────────────── */
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

      {/* The head SVG */}
      <svg
        className="cyber-head__svg"
        viewBox="0 0 200 230"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="headFace" cx="38%" cy="28%" r="65%">
            <stop offset="0%"   stopColor="#3a6688" />
            <stop offset="35%"  stopColor="#1d3f5e" />
            <stop offset="70%"  stopColor="#112338" />
            <stop offset="100%" stopColor="#070f1c" />
          </radialGradient>
          <radialGradient id="eyeGlowL" cx="50%" cy="40%" r="60%">
            <stop offset="0%"  stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="25%" stopColor="#00e5ff" />
            <stop offset="70%" stopColor="#0055aa" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#001133" stopOpacity="0.3" />
          </radialGradient>
          <radialGradient id="eyeGlowR" cx="50%" cy="40%" r="60%">
            <stop offset="0%"  stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="25%" stopColor="#00ff88" />
            <stop offset="70%" stopColor="#005533" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#001133" stopOpacity="0.3" />
          </radialGradient>
          <radialGradient id="innerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%"  stopColor="rgba(0,229,255,0.15)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <filter id="headGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="eyeFilter">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <linearGradient id="metalSheen" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="rgba(255,255,255,0.12)" />
            <stop offset="50%"  stopColor="rgba(255,255,255,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.3)" />
          </linearGradient>
          <linearGradient id="antennaGrad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%"  stopColor="#0a2233" />
            <stop offset="100%" stopColor="#00e5ff" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        {/* ── NECK / COLLAR ── */}
        <rect x="82" y="192" width="36" height="28" rx="2"
          fill="#0a1a28" stroke="#00c8ff" strokeWidth="0.75" opacity="0.9" />
        <rect x="86" y="196" width="12" height="3" rx="1" fill="#00c8ff" opacity="0.5" />
        <rect x="102" y="196" width="12" height="3" rx="1" fill="#00ff41" opacity="0.5" />
        <rect x="86" y="202" width="28" height="2" rx="1" fill="#001a33" />
        <rect x="86" y="208" width="28" height="2" rx="1" fill="#001a33" />
        <rect x="86" y="214" width="28" height="2" rx="1" fill="#001a33" />

        {/* ── MAIN HEAD SHAPE ── */}
        <ellipse cx="100" cy="108" rx="74" ry="82"
          fill="url(#headFace)"
          stroke="#1a4060"
          strokeWidth="1" />

        {/* Metal sheen overlay */}
        <ellipse cx="100" cy="108" rx="74" ry="82"
          fill="url(#metalSheen)" opacity="0.6" />

        {/* ── FOREHEAD PANEL ── */}
        <path d="M52 68 Q100 52 148 68 L144 92 Q100 78 56 92 Z"
          fill="#0d2035" stroke="#00c8ff" strokeWidth="0.5" opacity="0.7" />

        {/* Circuit traces on forehead */}
        <path d="M65 72 H80 V78 H95" stroke="#00e5ff" strokeWidth="0.7" fill="none" opacity="0.65" />
        <path d="M135 72 H120 V78 H105" stroke="#00e5ff" strokeWidth="0.7" fill="none" opacity="0.65" />
        <path d="M90 78 H110" stroke="#00ff41" strokeWidth="0.5" fill="none" opacity="0.5" />
        <circle cx="65" cy="72" r="2" fill="#00e5ff" opacity="0.8" />
        <circle cx="135" cy="72" r="2" fill="#00e5ff" opacity="0.8" />
        <circle cx="100" cy="78" r="1.5" fill="#00ff41" opacity="0.9" />

        {/* Mid-face panel lines */}
        <path d="M38 105 H55" stroke="#00c8ff" strokeWidth="0.5" opacity="0.4" />
        <path d="M145 105 H162" stroke="#00c8ff" strokeWidth="0.5" opacity="0.4" />

        {/* ── LEFT EYE SOCKET ── */}
        <ellipse cx="72" cy="105" rx="20" ry="15"
          fill="#040f1e" stroke="#00c8ff" strokeWidth="1.2" />
        <ellipse cx="72" cy="105" rx="18" ry="13"
          fill="#020a17" />
        {/* Eye iris */}
        <ellipse cx="72" cy="105" rx="13" ry="10"
          fill="url(#eyeGlowL)" className="cyber-eye" filter="url(#eyeFilter)" />
        {/* Pupil */}
        <circle cx="72" cy="105" r="5.5" fill="#001122" />
        <circle cx="72" cy="105" r="3.5" fill="#00ccff" opacity="0.95" />
        <circle cx="72" cy="105" r="1.5" fill="#ffffff" opacity="0.9" />
        {/* Specular */}
        <circle cx="68" cy="101" r="2.5" fill="white" opacity="0.55" />
        {/* Iris ring detail */}
        <ellipse cx="72" cy="105" rx="13" ry="10"
          fill="none" stroke="#00e5ff" strokeWidth="0.4" opacity="0.4" />

        {/* ── RIGHT EYE SOCKET ── */}
        <ellipse cx="128" cy="105" rx="20" ry="15"
          fill="#040f1e" stroke="#00c8ff" strokeWidth="1.2" />
        <ellipse cx="128" cy="105" rx="18" ry="13"
          fill="#020a17" />
        {/* Eye iris — green tinted */}
        <ellipse cx="128" cy="105" rx="13" ry="10"
          fill="url(#eyeGlowR)" className="cyber-eye" filter="url(#eyeFilter)" />
        {/* Pupil */}
        <circle cx="128" cy="105" r="5.5" fill="#001122" />
        <circle cx="128" cy="105" r="3.5" fill="#00ff88" opacity="0.95" />
        <circle cx="128" cy="105" r="1.5" fill="#ffffff" opacity="0.9" />
        {/* Specular */}
        <circle cx="124" cy="101" r="2.5" fill="white" opacity="0.55" />
        <ellipse cx="128" cy="105" rx="13" ry="10"
          fill="none" stroke="#00ff41" strokeWidth="0.4" opacity="0.4" />

        {/* ── NOSE BRIDGE ── */}
        <path d="M94 120 L97 132 L100 136 L103 132 L106 120"
          stroke="#1a3a55" strokeWidth="1" fill="none" opacity="0.5" />

        {/* ── MOUTH / SPEAKER GRILLE ── */}
        <rect x="62" y="143" width="76" height="26" rx="4"
          fill="#040f1e" stroke="#00c8ff" strokeWidth="0.8" />
        <line x1="62" y1="149" x2="138" y2="149" stroke="#00c8ff" strokeWidth="0.5" opacity="0.4" />
        <line x1="62" y1="154" x2="138" y2="154" stroke="#00c8ff" strokeWidth="0.5" opacity="0.4" />
        <line x1="62" y1="159" x2="138" y2="159" stroke="#00c8ff" strokeWidth="0.5" opacity="0.4" />
        <line x1="62" y1="164" x2="138" y2="164" stroke="#00c8ff" strokeWidth="0.5" opacity="0.4" />
        {/* Vertical grille dividers */}
        <line x1="80"  y1="143" x2="80"  y2="169" stroke="#00c8ff" strokeWidth="0.3" opacity="0.25" />
        <line x1="100" y1="143" x2="100" y2="169" stroke="#00c8ff" strokeWidth="0.3" opacity="0.25" />
        <line x1="120" y1="143" x2="120" y2="169" stroke="#00c8ff" strokeWidth="0.3" opacity="0.25" />
        {/* Mouth status LED */}
        <circle cx="131" cy="147" r="2" fill="#00ff41" className="status-led" />

        {/* ── CHEEK HIGHLIGHTS ── */}
        <ellipse cx="52" cy="118" rx="10" ry="14"
          fill="rgba(100,200,255,0.06)" />
        <ellipse cx="148" cy="118" rx="10" ry="14"
          fill="rgba(100,200,255,0.06)" />

        {/* ── TEMPLE HARDWARE LEFT ── */}
        <rect x="22" y="92" width="18" height="32" rx="2"
          fill="#0a1a28" stroke="#00c8ff" strokeWidth="0.75" />
        <rect x="25" y="95"  width="12" height="4" rx="1" fill="#00c8ff" opacity="0.7" />
        <rect x="25" y="101" width="12" height="4" rx="1" fill="#003344" />
        <rect x="25" y="107" width="12" height="4" rx="1" fill="#00c8ff" opacity="0.45" />
        <rect x="25" y="113" width="12" height="4" rx="1" fill="#003344" />
        <rect x="25" y="119" width="7"  height="2" rx="1" fill="#00ff41" opacity="0.6" />

        {/* ── TEMPLE HARDWARE RIGHT ── */}
        <rect x="160" y="92" width="18" height="32" rx="2"
          fill="#0a1a28" stroke="#00c8ff" strokeWidth="0.75" />
        <rect x="163" y="95"  width="12" height="4" rx="1" fill="#00c8ff" opacity="0.7" />
        <rect x="163" y="101" width="12" height="4" rx="1" fill="#003344" />
        <rect x="163" y="107" width="12" height="4" rx="1" fill="#00c8ff" opacity="0.45" />
        <rect x="163" y="113" width="12" height="4" rx="1" fill="#003344" />
        <rect x="163" y="119" width="7"  height="2" rx="1" fill="#ff6600" opacity="0.6" />

        {/* ── CHIN DETAIL ── */}
        <path d="M66 175 Q100 192 134 175"
          fill="none" stroke="#1a3a55" strokeWidth="1" opacity="0.6" />
        <path d="M82 182 H118"
          stroke="#00c8ff" strokeWidth="0.5" opacity="0.3" />

        {/* ── ANTENNA ── */}
        <line x1="100" y1="26" x2="100" y2="52"
          stroke="url(#antennaGrad)" strokeWidth="1.5" />
        {/* Side branches */}
        <line x1="82" y1="36" x2="100" y2="44"
          stroke="#00c8ff" strokeWidth="0.8" opacity="0.55" />
        <line x1="118" y1="36" x2="100" y2="44"
          stroke="#00c8ff" strokeWidth="0.8" opacity="0.55" />
        <line x1="82" y1="36" x2="76" y2="30"
          stroke="#00c8ff" strokeWidth="0.6" opacity="0.35" />
        <line x1="118" y1="36" x2="124" y2="30"
          stroke="#00c8ff" strokeWidth="0.6" opacity="0.35" />
        {/* Antenna tip — animated blink */}
        <circle cx="100" cy="22" r="5" fill="#001122"
          stroke="#00e5ff" strokeWidth="1" />
        <circle cx="100" cy="22" r="3" fill="#00e5ff" className="antenna-tip" />

        {/* ── INNER FACE GLOW ── */}
        <ellipse cx="100" cy="108" rx="55" ry="62"
          fill="url(#innerGlow)" opacity="0.4" />
      </svg>

      {/* Scan beam across the face */}
      <div className="cyber-head__scan-beam" />
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
