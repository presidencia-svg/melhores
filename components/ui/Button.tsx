import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "gold" | "danger";
type Size = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
};

const base =
  "inline-flex items-center justify-center gap-2 font-medium tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-cream-300 disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary:
    "bg-navy-800 text-cream-100 hover:bg-navy-900 active:scale-[0.98] focus-visible:ring-navy-800 shadow-sm",
  secondary:
    "bg-green-600 text-cream-100 hover:bg-green-600/90 active:scale-[0.98] focus-visible:ring-green-600 shadow-sm",
  gold:
    "bg-gold-500 text-navy-900 hover:bg-gold-400 active:scale-[0.98] focus-visible:ring-gold-500 shadow-sm font-semibold",
  ghost: "text-navy-800 hover:bg-navy-800/5",
  outline:
    "border-[1.5px] border-navy-800 text-navy-800 hover:bg-navy-800 hover:text-cream-100 focus-visible:ring-navy-800",
  danger:
    "bg-red-700 text-white hover:bg-red-800 focus-visible:ring-red-600",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-12 px-6 text-base",
  lg: "h-14 px-8 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.25" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" fill="none" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
