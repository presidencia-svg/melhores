import { cn } from "@/lib/utils";

const STEPS = [
  { num: "01", label: "Identificação", short: "ID" },
  { num: "02", label: "Selfie", short: "Selfie" },
  { num: "03", label: "Voto", short: "Voto" },
  { num: "04", label: "Pronto", short: "Pronto" },
] as const;

export function StepIndicator({ current }: { current: 1 | 2 | 3 | 4 }) {
  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="flex items-center justify-between gap-1.5 sm:gap-2">
        {STEPS.map((step, idx) => {
          const stepIdx = idx + 1;
          const done = stepIdx < current;
          const active = stepIdx === current;
          return (
            <div key={step.num} className="flex items-center flex-1 last:flex-none gap-1.5 sm:gap-2 min-w-0">
              <div className="flex flex-col items-start gap-0.5 min-w-0">
                <span
                  className={cn(
                    "kicker transition-colors leading-none",
                    done && "text-gold-700",
                    active && "text-navy-800",
                    !done && !active && "text-navy-800/30"
                  )}
                  style={{ fontSize: 8 }}
                >
                  {step.num}
                </span>
                <span
                  className={cn(
                    "font-display-bold transition-colors truncate",
                    done && "text-gold-700",
                    active && "text-navy-800",
                    !done && !active && "text-navy-800/30"
                  )}
                  style={{ fontSize: 13, fontStyle: "italic", fontWeight: 700 }}
                >
                  <span className="hidden sm:inline">{step.label}</span>
                  <span className="sm:hidden">{step.short}</span>
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={cn(
                    "h-px flex-1 transition-colors min-w-3",
                    done ? "bg-gold-500" : "bg-navy-800/15"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
