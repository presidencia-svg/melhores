import { cn } from "@/lib/utils";

type EventLogoProps = {
  className?: string;
  ano?: number;
};

export function EventLogo({ className, ano = 2026 }: EventLogoProps) {
  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className="flex items-center gap-3">
        <svg viewBox="0 0 48 48" className="h-10 w-10 text-cdl-yellow" fill="currentColor" aria-hidden="true">
          <path d="M24 2l5.5 13.5L44 17l-11 9.5L36 41l-12-7.5L12 41l3-14.5L4 17l14.5-1.5L24 2z" />
        </svg>
        <div className="flex flex-col leading-none">
          <span className="font-display text-xs font-semibold uppercase tracking-[0.3em] text-cdl-blue">
            Melhores do Ano
          </span>
          <span className="font-display text-3xl font-extrabold text-cdl-blue">
            CDL Aracaju <span className="text-cdl-green">{ano}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
