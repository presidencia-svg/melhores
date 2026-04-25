import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const STEPS = [
  { num: 1, label: "Identificação" },
  { num: 2, label: "Selfie" },
  { num: 3, label: "Voto" },
  { num: 4, label: "Pronto" },
] as const;

export function StepIndicator({ current }: { current: 1 | 2 | 3 | 4 }) {
  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="flex items-center justify-between">
        {STEPS.map((step, idx) => {
          const done = step.num < current;
          const active = step.num === current;
          return (
            <div key={step.num} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all",
                    done && "bg-cdl-green text-white",
                    active && "bg-cdl-blue text-white ring-4 ring-cdl-blue/20",
                    !done && !active && "bg-border text-muted"
                  )}
                >
                  {done ? <Check className="w-4 h-4" /> : step.num}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium hidden sm:block",
                    active ? "text-cdl-blue" : "text-muted"
                  )}
                >
                  {step.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 flex-1 mx-2 transition-colors",
                    done ? "bg-cdl-green" : "bg-border"
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
