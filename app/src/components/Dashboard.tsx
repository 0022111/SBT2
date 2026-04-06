import { useState } from "react";
import { useBluetooth } from "../providers/BluetoothProvider";
import { useDeviceStatus } from "../hooks/useDeviceStatus";
import { RadialGauge } from "./RadialGauge";
import "./Dashboard.css";

/* ── Inline SVG Icons ─────────────────────────────────── */

function BoltIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

function PowerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
      <line x1="12" y1="2" x2="12" y2="12" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function BatteryBarIcon({ level }: { level: number }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="6" width="18" height="12" rx="2" />
      <line x1="23" y1="10" x2="23" y2="14" />
      {level > 10 && (
        <rect
          x="4"
          y="9"
          width={Math.min(12, Math.round((level / 100) * 12))}
          height="6"
          rx="1"
          fill="currentColor"
          stroke="none"
        />
      )}
    </svg>
  );
}

/* ── Helpers ──────────────────────────────────────────── */

function batteryColor(level: number): string {
  if (level > 60) return "var(--success)";
  if (level > 20) return "var(--accent)";
  return "var(--danger)";
}

/* ── Toggle Component ─────────────────────────────────── */

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <button
      className={`toggle ${checked ? "toggle--on" : ""}`}
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
      type="button"
    >
      <span className="toggle__knob" />
    </button>
  );
}

/* ── Dashboard ────────────────────────────────────────── */

export function Dashboard() {
  const { disconnect, deviceInfo } = useBluetooth();
  const {
    status,
    displayTargetTemp,
    displayBoostDelta,
    displaySuperBoostDelta,
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
  } = useDeviceStatus();

  const [showSettings, setShowSettings] = useState(false);
  const [pendingTemp, setPendingTemp] = useState<number | null>(null);

  /* Loading state */
  if (!status) {
    return (
      <div className="dash-loading">
        <div className="dash-loading__spinner" />
        Waiting for device data…
      </div>
    );
  }

  const unit = status.isCelsius ? "C" : "F";
  const minTemp = status.isCelsius ? 40 : 104;
  const maxTemp = status.isCelsius ? 210 : 410;
  const battery = status.batteryLevel ?? 0;
  const tempDisplay = pendingTemp ?? displayTargetTemp;

  // Boost label for the gauge
  const boostLabel =
    status.heaterMode === 2
      ? "Boost"
      : status.heaterMode === 3
        ? "Super Boost"
        : undefined;
  const showEffective =
    status.heaterMode !== null && status.heaterMode > 1;

  return (
    <div className="dashboard">
      {/* ── Status Bar ──────────────────────────────── */}
      <div className="dash-status-bar">
        <div className="dash-status-bar__name">
          <span className="dash-status-bar__bt-dot" />
          {deviceInfo.name || "Device"}
        </div>

        <span
          className="pill dash-status-bar__battery"
          style={{ color: batteryColor(battery) }}
        >
          <BatteryBarIcon level={battery} />
          {battery}%
        </span>

        {status.isCharging && (
          <span className="dash-status-bar__charging">
            <BoltIcon />
          </span>
        )}

        <button
          className="btn btn--icon dash-status-bar__disconnect"
          onClick={disconnect}
          aria-label="Disconnect"
        >
          <PowerIcon />
        </button>
      </div>

      {/* ── Radial Gauge ────────────────────────────── */}
      <div className="dash-gauge-section">
        <RadialGauge
          value={tempDisplay}
          min={minTemp}
          max={maxTemp}
          unit={unit}
          isHeating={status.isHeating}
          setpointReached={status.setpointReached}
          effectiveTemp={showEffective ? effectiveTemp : undefined}
          boostLabel={boostLabel}
        />
      </div>

      {/* ── Temperature Slider ──────────────────────── */}
      <div className="dash-temp-controls">
        <div className="glass-card dash-temp-card">
          <div className="dash-temp-card__header">
            <span className="dash-temp-card__label">Temperature</span>
            <span className="dash-temp-card__value">
              {tempDisplay}°{unit}
            </span>
          </div>
          <input
            className="range-slider"
            type="range"
            min={minTemp}
            max={maxTemp}
            step={1}
            value={pendingTemp ?? displayTargetTemp}
            onChange={(e) => setPendingTemp(Number(e.target.value))}
            onMouseUp={(e) => {
              const v = Number((e.target as HTMLInputElement).value);
              setPendingTemp(null);
              const celsius = status.isCelsius
                ? v
                : Math.round((v - 32) / 1.8);
              setTargetTemp(celsius);
            }}
            onTouchEnd={(e) => {
              const v = Number((e.target as HTMLInputElement).value);
              setPendingTemp(null);
              const celsius = status.isCelsius
                ? v
                : Math.round((v - 32) / 1.8);
              setTargetTemp(celsius);
            }}
          />
          <div className="dash-temp-card__range-row">
            <span>{minTemp}°{unit}</span>
            <span>{maxTemp}°{unit}</span>
          </div>
        </div>
      </div>

      {/* ── Heater Toggle ───────────────────────────── */}
      <div className="dash-heater">
        <div className="glass-card dash-heater__card">
          <div>
            <div className="dash-heater__label">Heater</div>
            <div className="dash-heater__sublabel">
              {status.isHeating
                ? boostLabel
                  ? `${boostLabel} active`
                  : "Heating"
                : "Standby"}
            </div>
          </div>
          <button
            className={`btn dash-heater__btn ${
              status.isHeating
                ? "dash-heater__btn--active"
                : "btn--ghost"
            }`}
            onClick={() =>
              setHeaterMode(
                (status.heaterMode ?? 0) > 0 ? 0 : 1
              )
            }
          >
            {status.isHeating ? "ON" : "OFF"}
          </button>
        </div>
      </div>

      {/* ── Boost Cards ─────────────────────────────── */}
      <div className="dash-boost-grid">
        {([
          {
            mode: 2,
            label: "Boost",
            delta: displayBoostDelta,
            adjust: (d: number) =>
              setBoostTemp(
                Math.max(0, (status.boostTemp ?? 0) + d)
              ),
          },
          {
            mode: 3,
            label: "Super Boost",
            delta: displaySuperBoostDelta,
            adjust: (d: number) =>
              setSuperBoostTemp(
                Math.max(0, (status.superBoostTemp ?? 0) + d)
              ),
          },
        ] as const).map(({ mode, label, delta, adjust }) => {
          const active = status.heaterMode === mode;
          return (
            <div
              key={mode}
              className={`glass-card dash-boost-card ${
                active ? "dash-boost-card--active" : ""
              }`}
              onClick={() => {
                if (active) setHeaterMode(1);
                else setHeaterMode(mode);
              }}
            >
              <div className="dash-boost-card__label">{label}</div>
              <div className="dash-boost-card__delta">
                +{delta}°{unit}
              </div>
              <div className="dash-boost-card__controls">
                <button
                  className="btn btn--icon dash-boost-card__adj-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    adjust(-1);
                  }}
                >
                  −
                </button>
                <button
                  className="btn btn--icon dash-boost-card__adj-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    adjust(1);
                  }}
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Battery ─────────────────────────────────── */}
      <div className="dash-battery">
        <div className="glass-card dash-battery__card">
          <div className="dash-battery__header">
            <span className="dash-battery__label">Battery</span>
            <span
              className="dash-battery__percentage"
              style={{ color: batteryColor(battery) }}
            >
              {battery}%
            </span>
          </div>
          <div className="dash-battery__bar">
            <div
              className="dash-battery__fill"
              style={{
                width: `${battery}%`,
                background: batteryColor(battery),
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Settings ────────────────────────────────── */}
      <div className="dash-settings">
        <div className="glass-card dash-settings__card">
          <button
            className="dash-settings__trigger"
            onClick={() => setShowSettings(!showSettings)}
          >
            <SettingsIcon />
            <span className="dash-settings__trigger-label">
              Settings
            </span>
            <ChevronDownIcon
              className={`dash-settings__chevron ${
                showSettings ? "dash-settings__chevron--open" : ""
              }`}
            />
          </button>

          <div
            className={`dash-settings__content ${
              showSettings ? "dash-settings__content--open" : ""
            }`}
          >
            <div className="dash-settings__inner">
              <div className="dash-settings__divider" />

              {/* Unit toggle */}
              <div className="dash-settings__row">
                <span className="dash-settings__row-label">
                  {status.isCelsius ? "Celsius" : "Fahrenheit"}
                </span>
                <Toggle
                  checked={status.isCelsius}
                  onChange={(v) => setIsCelsius(v)}
                />
              </div>

              {/* Eco Charge Current */}
              <div className="dash-settings__row">
                <span className="dash-settings__row-label">
                  Eco Charge Current
                </span>
                <Toggle
                  checked={status.chargeCurrentOptimization}
                  onChange={(v) => setChargeCurrentOptimization(v)}
                />
              </div>

              {/* Eco Charge Voltage */}
              <div className="dash-settings__row">
                <span className="dash-settings__row-label">
                  Eco Charge Voltage
                </span>
                <Toggle
                  checked={status.chargeVoltageLimit}
                  onChange={(v) => setChargeVoltageLimit(v)}
                />
              </div>

              {/* Permanent Bluetooth */}
              <div className="dash-settings__row">
                <span className="dash-settings__row-label">
                  Permanent Bluetooth
                </span>
                <Toggle
                  checked={status.permanentBluetooth}
                  onChange={(v) => setPermanentBluetooth(v)}
                />
              </div>

              <div className="dash-settings__divider" />

              {/* Auto-Shutdown */}
              <div className="dash-settings__slider-section">
                <div className="dash-settings__row">
                  <span className="dash-settings__slider-label">
                    Auto-Shutdown
                  </span>
                  <span className="dash-settings__slider-value">
                    {status.autoShutdownTimer ?? 0}s
                  </span>
                </div>
                <input
                  className="range-slider"
                  type="range"
                  min={0}
                  max={600}
                  step={30}
                  value={status.autoShutdownTimer ?? 0}
                  onMouseUp={(e) =>
                    setAutoShutdownTimer(
                      Number((e.target as HTMLInputElement).value)
                    )
                  }
                  onTouchEnd={(e) =>
                    setAutoShutdownTimer(
                      Number((e.target as HTMLInputElement).value)
                    )
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
