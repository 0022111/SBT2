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
  const radius = 100;
  const cx = 130;
  const cy = 130;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * (270 / 360);
  const fraction = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const dashOffset = arcLength * (1 - fraction);

  // Outer decorative ring
  const outerRadius = 116;
  const outerCircumference = 2 * Math.PI * outerRadius;
  const outerArcLength = outerCircumference * (270 / 360);

  // Inner decorative ring
  const innerRadius = 83;
  const innerCircumference = 2 * Math.PI * innerRadius;
  const innerArcLength = innerCircumference * (270 / 360);

  // Tick marks (every 10% = 27 degrees around the arc, starting at -135deg)
  const tickCount = 20;
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => {
    const angle = -135 + (270 / tickCount) * i;
    const rad = (angle * Math.PI) / 180;
    const tickR1 = 118;
    const tickR2 = i % 5 === 0 ? 107 : 112;
    return {
      x1: cx + tickR1 * Math.cos(rad),
      y1: cy + tickR1 * Math.sin(rad),
      x2: cx + tickR2 * Math.cos(rad),
      y2: cy + tickR2 * Math.sin(rad),
      major: i % 5 === 0,
    };
  });

  // Radar sweep angle based on fraction (just a decorative rotating element)
  const sweepAngle = -135 + fraction * 270;
  const sweepRad = (sweepAngle * Math.PI) / 180;
  const sweepEndX = cx + 96 * Math.cos(sweepRad);
  const sweepEndY = cy + 96 * Math.sin(sweepRad);

  const gradientId = "gauge-gradient";
  const segGradId = "gauge-seg-gradient";

  const classNames = [
    "gauge",
    isHeating ? "gauge--heating" : "",
    setpointReached ? "gauge--reached" : "",
    isHitInProgress ? "gauge--hit" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classNames}>
      <svg className="gauge__svg" viewBox="0 0 260 260">
        <defs>
          {/* Main arc gradient — green to cyan when normal */}
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            {setpointReached ? (
              <>
                <stop offset="0%"   stopColor="#00e5ff" />
                <stop offset="100%" stopColor="#00ff88" />
              </>
            ) : isHeating ? (
              <>
                <stop offset="0%"   stopColor="#00ff41" />
                <stop offset="60%"  stopColor="#00e5ff" />
                <stop offset="100%" stopColor="#aa00ff" />
              </>
            ) : (
              <>
                <stop offset="0%"   stopColor="#005533" />
                <stop offset="100%" stopColor="#003344" />
              </>
            )}
          </linearGradient>

          {/* Segmented overlay gradient for track */}
          <linearGradient id={segGradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="rgba(0,255,65,0.08)" />
            <stop offset="100%" stopColor="rgba(0,229,255,0.06)" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="arcGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Strong glow for fill */}
          <filter id="fillGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Radar sweep gradient */}
          <radialGradient id="radarGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="rgba(0,255,65,0.5)" />
            <stop offset="100%" stopColor="rgba(0,255,65,0)" />
          </radialGradient>
        </defs>

        {/* ── OUTERMOST DECORATIVE RING ── */}
        <circle
          className="gauge__outer-ring"
          cx={cx}
          cy={cy}
          r={outerRadius}
          strokeDasharray={`${outerArcLength} ${outerCircumference}`}
          strokeDashoffset={0}
        />

        {/* ── TICK MARKS ── */}
        {ticks.map((t, i) => (
          <line
            key={i}
            x1={t.x1} y1={t.y1}
            x2={t.x2} y2={t.y2}
            className={`gauge__tick ${t.major ? "gauge__tick--major" : ""}`}
          />
        ))}

        {/* ── BACKGROUND TRACK ── */}
        <circle
          className="gauge__track"
          cx={cx}
          cy={cy}
          r={radius}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={0}
        />

        {/* ── INNER DECORATIVE RING ── */}
        <circle
          className="gauge__inner-ring"
          cx={cx}
          cy={cy}
          r={innerRadius}
          strokeDasharray={`${innerArcLength} ${innerCircumference}`}
          strokeDashoffset={0}
        />

        {/* ── FILLED ARC (blurred glow copy behind) ── */}
        <circle
          className="gauge__fill-glow"
          cx={cx}
          cy={cy}
          r={radius}
          stroke={setpointReached ? "#00e5ff" : `url(#${gradientId})`}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={dashOffset}
          filter="url(#fillGlow)"
        />

        {/* ── FILLED ARC (crisp, on top) ── */}
        <circle
          className="gauge__fill"
          cx={cx}
          cy={cy}
          r={radius}
          stroke={setpointReached ? `url(#${gradientId})` : `url(#${gradientId})`}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={dashOffset}
        />

        {/* ── SWEEP LINE (indicator of setpoint) ── */}
        {fraction > 0 && (
          <line
            className="gauge__sweep-line"
            x1={cx}
            y1={cy}
            x2={sweepEndX}
            y2={sweepEndY}
          />
        )}

        {/* ── HIT RING ── */}
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

        {/* ── CENTER CROSSHAIR DECORATION ── */}
        <circle cx={cx} cy={cy} r={60}
          fill="none" stroke="rgba(0,229,255,0.04)" strokeWidth="1" />
        <circle cx={cx} cy={cy} r={40}
          fill="none" stroke="rgba(0,255,65,0.04)" strokeWidth="0.5" />

        {/* Corner bracket marks at 4 quadrant positions */}
        {[[-45], [45], [135], [225]].map(([a], i) => {
          const r2 = (a * Math.PI) / 180;
          const bx = cx + 58 * Math.cos(r2);
          const by = cy + 58 * Math.sin(r2);
          return (
            <circle key={i} cx={bx} cy={by} r="1.5"
              fill="rgba(0,229,255,0.25)" />
          );
        })}
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
            READY
          </span>
        )}

        {isHeating && !setpointReached && (
          <span className="gauge__heating-badge">
            HEATING
          </span>
        )}
      </div>
    </div>
  );
}
