import { cn } from "@/lib/utils";
import { SmallCaps, Divider } from "./Marks";

type EventLogoProps = {
  className?: string;
  ano?: number;
  size?: "sm" | "md" | "lg";
  align?: "left" | "center";
};

const SIZES = {
  sm: { kicker: 10, melhor: 32, ano: 22 },
  md: { kicker: 11, melhor: 56, ano: 36 },
  lg: { kicker: 13, melhor: 92, ano: 56 },
} as const;

export function EventLogo({ className, ano = 2025, size = "md", align = "center" }: EventLogoProps) {
  const s = SIZES[size];
  return (
    <div
      className={cn(
        "flex flex-col gap-1",
        align === "center" ? "items-center text-center" : "items-start text-left",
        className
      )}
    >
      <SmallCaps color="var(--gold-700)" size={s.kicker}>
        cdl aracaju · {ano}
      </SmallCaps>
      <div
        className="font-display text-navy-800 leading-[0.95]"
        style={{ fontSize: s.melhor, fontWeight: 300 }}
      >
        Os melhores
      </div>
      <div
        className="font-display-bold text-navy-800 leading-[0.85]"
        style={{ fontSize: s.melhor * 1.25 }}
      >
        do ano
      </div>
      <div className="mt-2 flex items-center gap-2">
        <Divider width={32} color="var(--gold-500)" />
        <span
          className="font-display-bold text-gold-500"
          style={{ fontSize: s.ano, fontWeight: 900 }}
        >
          {ano}
        </span>
      </div>
    </div>
  );
}
