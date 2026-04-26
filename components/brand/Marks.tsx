// Reusable brand marks for Melhores do Ano CDL Aracaju 2026
// Adapted from /identidade-visual/ design system.

import { cn } from "@/lib/utils";

type MarkProps = {
  size?: number;
  color?: string;
  className?: string;
};

export function TrophyMark({ size = 56, color = "currentColor", className }: MarkProps) {
  return (
    <svg
      width={size}
      height={size * 1.1}
      viewBox="0 0 80 88"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path d="M20 8h40v18a20 20 0 0 1-40 0V8z" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M20 12c-6 0-10 3-10 8s4 8 10 8" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M60 12c6 0 10 3 10 8s-4 8-10 8" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M32 46v8c0 3 2 6 8 6s8-3 8-6v-8" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <rect x="24" y="60" width="32" height="6" rx="1" stroke={color} strokeWidth="2.5" />
      <rect x="20" y="66" width="40" height="6" rx="1.5" stroke={color} strokeWidth="2.5" />
      <path d="M32 24l5 4 8-8" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LaurelHalf({ size = 100, color = "currentColor", flip = false, className }: MarkProps & { flip?: boolean }) {
  return (
    <svg
      width={size}
      height={size * 1.6}
      viewBox="0 0 80 128"
      fill="none"
      style={{ transform: flip ? "scaleX(-1)" : "none" }}
      className={className}
      aria-hidden="true"
    >
      <path
        d="M70 124 C 50 110, 36 90, 30 68 C 26 50, 28 30, 38 8"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      {[12, 28, 44, 60, 76, 92, 106].map((y, i) => {
        const x = 30 + Math.abs(Math.sin(y / 14)) * 6 + (i % 2 === 0 ? -2 : 2);
        const rot = -30 + (i % 2 === 0 ? -25 : 25);
        return (
          <g key={i} transform={`translate(${x} ${y}) rotate(${rot})`}>
            <ellipse cx="0" cy="0" rx="3.5" ry="9" fill={color} opacity="0.92" />
          </g>
        );
      })}
      {[20, 36, 52, 68, 84, 100].map((y, i) => {
        const x = 30 + Math.cos(y / 12) * 5 + (i % 2 === 0 ? 2 : -2);
        const rot = 30 + (i % 2 === 0 ? 20 : -20);
        return (
          <g key={`r-${i}`} transform={`translate(${x} ${y}) rotate(${rot})`}>
            <ellipse cx="0" cy="0" rx="3" ry="8" fill={color} opacity="0.78" />
          </g>
        );
      })}
    </svg>
  );
}

export function LaurelWreath({ size = 80, color = "currentColor", className }: MarkProps) {
  return (
    <div
      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: -10 }}
      className={className}
    >
      <LaurelHalf size={size * 0.6} color={color} />
      <LaurelHalf size={size * 0.6} color={color} flip />
    </div>
  );
}

export function SmallCaps({
  children,
  color,
  size = 11,
  tracking = "0.4em",
  className,
}: {
  children: React.ReactNode;
  color?: string;
  size?: number;
  tracking?: string;
  className?: string;
}) {
  return (
    <span
      className={cn("kicker", className)}
      style={{
        color: color ?? undefined,
        fontSize: `${size}px`,
        letterSpacing: tracking,
      }}
    >
      {children}
    </span>
  );
}

export function Divider({ width = 32, color = "var(--gold-500)" }: { width?: number; color?: string }) {
  return <span style={{ display: "inline-block", width, height: 1, background: color }} />;
}

export function GoldOrnament({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn("inline-flex items-center gap-3 text-gold-700", className)}
      style={{ fontFamily: "var(--font-fraunces)", fontStyle: "italic", fontWeight: 800 }}
    >
      <Divider width={20} />
      {children}
      <Divider width={20} />
    </span>
  );
}
