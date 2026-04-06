import "./RadialGauge.css";

interface RadialGaugeProps {
  value: number;
  min: number;
  max: number;
  unit: string;
  isHeating: boolean;
  setpointReached: boolean;
  effectiveTemp?: number;
  boostLabel?: string;
  isHitInProgress: boolean;
}

export function RadialGauge({
  value,
  min,
  max,
  unit,
  isHeating,
  setpointReached,
  effectiveTemp,
  boostLabel,
  isHitInProgress,
}: RadialGaugeProps) {
  // SVG arc geometry — 270° sweep
  const radius = 110;
  const cx = 130;
  const cy = 130;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * (270 / 360); // ~518.36
  const fraction = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const dashOffset = arcLength * (1 - fraction);

  // Gradient colors
  const gradientId = "gauge-gradient";

  const classNames = [
    "gauge",
    isHeating ? "gauge--heating" : "",
    setpointReached ? "gauge--reached" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classNames}>
      <svg className="gauge__svg" viewBox="0 0 260 260">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>

        {/* Background track */}
        <circle
          className="gauge__track"
          cx={cx}
          cy={cy}
          r={radius}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={0}
        />

        {/* Filled arc */}
        <circle
          className="gauge__fill"
          cx={cx}
          cy={cy}
          r={radius}
          stroke={setpointReached ? "var(--success)" : `url(#${gradientId})`}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={dashOffset}
        />

        {/* Breathing Hit Ring overlay */}
        {isHitInProgress && (
          <circle
            className="gauge__hit-ring"
            cx={cx}
            cy={cy}
            r={radius}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={0}
          />
        )}
      </svg>

      {/* Center text overlay */}
      <div className="gauge__center">
        <span className="gauge__value">{value}</span>
        <span className="gauge__label">°{unit}</span>

        {effectiveTemp != null && boostLabel && (
          <span className="gauge__effective">
            {effectiveTemp}° — {boostLabel}
          </span>
        )}

        {setpointReached && (
          <span className="gauge__reached-badge">
            <span className="gauge__reached-dot" />
            Ready
          </span>
        )}
      </div>
    </div>
  );
}
