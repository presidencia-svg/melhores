import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, hint, error, id, ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="kicker text-navy-800/70" style={{ fontSize: 10 }}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "h-12 px-4 rounded-sm border border-[rgba(10,42,94,0.25)] bg-cream-100 text-foreground",
            "placeholder:text-muted",
            "focus:outline-none focus:border-navy-800 focus:ring-2 focus:ring-navy-800/15",
            "transition-colors font-medium",
            error && "border-red-600 focus:border-red-600 focus:ring-red-500/20",
            className
          )}
          {...props}
        />
        {hint && !error && <p className="text-xs text-muted">{hint}</p>}
        {error && <p className="text-xs text-red-700 font-medium">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
