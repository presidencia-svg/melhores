import { cn } from "@/lib/utils";

const STEPS = [
  { num: "01", label: "Identificação" },
  { num: "02", label: "Selfie" },
  { num: "03", label: "Voto" },
  { num: "04", label: "Pronto" },
] as const;

export function StepIndicator({ current }: { current: 1 | 2 | 3 | 4 }) {
  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="flex items-center justify-between gap-2">
        {STEPS.map((step, idx) => {
          const stepIdx = idx + 1;
          const done = stepIdx < current;
          const active = stepIdx === current;
          return (
            <div key={step.num} className="flex items-center flex-1 last:flex-none gap-2">
              <div className="flex flex-col items-start gap-1">
                <span
                  className={cn(
                    "kicker transition-colors",
                    done && "text-gold-700",
                    active && "text-navy-800",
                    !done && !active && "text-navy-800/30"
                  )}
                  style={{ fontSize: 9 }}
                >
                  passo {step.num}
                </span>
                <span
                  className={cn(
                    "font-display-bold transition-colors",
                    done && "text-gold-700",
                    active && "text-navy-800",
                    !done && !active && "text-navy-800/30"
                  )}
                  style={{ fontSize: 16, fontStyle: "italic", fontWeight: 700 }}
                >
                  {step.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={cn(
                    "h-px flex-1 transition-colors",
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
