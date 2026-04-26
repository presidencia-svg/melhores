// Reusable brand marks for Melhores do Ano CDL Aracaju 2026

const TrophyMark = ({ size = 80, color = "currentColor" }) => (
  <svg width={size} height={size * 1.1} viewBox="0 0 80 88" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 8h40v18a20 20 0 0 1-40 0V8z" stroke={color} strokeWidth="2.5" strokeLinejoin="round"/>
    <path d="M20 12c-6 0-10 3-10 8s4 8 10 8" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M60 12c6 0 10 3 10 8s-4 8-10 8" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M32 46v8c0 3 2 6 8 6s8-3 8-6v-8" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
    <rect x="24" y="60" width="32" height="6" rx="1" stroke={color} strokeWidth="2.5"/>
    <rect x="20" y="66" width="40" height="6" rx="1.5" stroke={color} strokeWidth="2.5"/>
    <path d="M32 24l5 4 8-8" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const LaurelHalf = ({ size = 200, color = "currentColor", flip = false }) => (
  <svg width={size} height={size * 1.6} viewBox="0 0 80 128" fill="none"
       style={{ transform: flip ? "scaleX(-1)" : "none" }}>
    <path d="M70 124 C 50 110, 36 90, 30 68 C 26 50, 28 30, 38 8"
          stroke={color} strokeWidth="2" strokeLinecap="round" fill="none"/>
    {[12, 28, 44, 60, 76, 92, 106].map((y, i) => {
      const x = 30 + Math.abs(Math.sin(y / 14)) * 6 + (i % 2 === 0 ? -2 : 2);
      const rot = -30 + (i % 2 === 0 ? -25 : 25);
      return (
        <g key={i} transform={`translate(${x} ${y}) rotate(${rot})`}>
          <ellipse cx="0" cy="0" rx="3.5" ry="9" fill={color} opacity="0.92"/>
          <path d="M0 -8 L0 8" stroke={flip ? "#fff" : "#fff"} strokeOpacity="0.18" strokeWidth="0.6"/>
        </g>
      );
    })}
    {[20, 36, 52, 68, 84, 100].map((y, i) => {
      const x = 36 + Math.abs(Math.sin(y / 12)) * 6;
      const rot = 30 + (i % 2 === 0 ? 15 : -15);
      return (
        <g key={"r" + i} transform={`translate(${x} ${y}) rotate(${rot})`}>
          <ellipse cx="0" cy="0" rx="3" ry="8" fill={color} opacity="0.85"/>
        </g>
      );
    })}
  </svg>
);

const LaurelWreath = ({ size = 200, color = "currentColor" }) => (
  <div style={{ position: "relative", width: size, height: size, display: "inline-block" }}>
    <div style={{ position: "absolute", left: 0, top: 0 }}>
      <LaurelHalf size={size * 0.5} color={color} />
    </div>
    <div style={{ position: "absolute", right: 0, top: 0 }}>
      <LaurelHalf size={size * 0.5} color={color} flip />
    </div>
  </div>
);

const StarMark = ({ size = 24, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M12 2l2.6 6.5L21 9.3l-5 4.5 1.4 6.7L12 17l-5.4 3.5L8 13.8 3 9.3l6.4-.8L12 2z"/>
  </svg>
);

// CDL wave shape — reinterpreted as a flat geometric crest
const CDLCrest = ({ size = 64 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="crestNavy" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#1a4ea8"/>
        <stop offset="100%" stopColor="#061d44"/>
      </linearGradient>
    </defs>
    <path d="M8 4 H52 C56 4 60 8 60 12 V52 C60 56 56 60 52 60 H12 C8 60 4 56 4 52 V12 C 16 30 28 46 8 56 Z"
          fill="url(#crestNavy)"/>
    <path d="M8 56 C 28 46 16 30 4 12 V 52 C 4 56 8 60 12 60 H 52 C 30 58 16 56 8 56Z"
          fill="#0f8a3f" opacity="0.9"/>
    <path d="M10 52 C 22 46 14 32 6 18 V 50 C 6 52 8 54 10 54 Z"
          fill="#e8c441"/>
  </svg>
);

// Decorative number 2026 with serifs
const Numerals = ({ size = 220, color = "currentColor", style = {} }) => (
  <div style={{
    fontFamily: 'var(--font-display)',
    fontWeight: 900,
    fontSize: size,
    lineHeight: 0.85,
    color,
    fontFeatureSettings: '"ss01", "lnum"',
    letterSpacing: "-0.03em",
    fontStyle: "italic",
    ...style,
  }}>2026</div>
);

const SmallCaps = ({ children, size = 14, tracking = "0.32em", weight = 600, color = "currentColor", style = {} }) => (
  <div style={{
    fontFamily: 'var(--font-sans)',
    textTransform: "uppercase",
    letterSpacing: tracking,
    fontSize: size,
    fontWeight: weight,
    color,
    ...style,
  }}>{children}</div>
);

const Divider = ({ width = 60, color = "currentColor", thickness = 1.5, withDot = true }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
    <div style={{ width, height: thickness, background: color }}/>
    {withDot && <div style={{ width: 5, height: 5, background: color, borderRadius: "50%" }}/>}
    <div style={{ width, height: thickness, background: color }}/>
  </div>
);

Object.assign(window, {
  TrophyMark, LaurelHalf, LaurelWreath, StarMark, CDLCrest,
  Numerals, SmallCaps, Divider,
});
