import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  variant?: "full" | "compact" | "white";
};

export function Logo({ className, variant = "full" }: LogoProps) {
  const isWhite = variant === "white";
  const blue = isWhite ? "#FFFFFF" : "#1B3A7A";
  const green = isWhite ? "#FFFFFF" : "#00A859";
  const yellow = isWhite ? "#FFFFFF" : "#FFD700";

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <svg
        viewBox="0 0 80 80"
        xmlns="http://www.w3.org/2000/svg"
        className="h-12 w-12 shrink-0"
        aria-hidden="true"
      >
        <path
          d="M8 12 C 14 8, 50 6, 60 10 L 60 64 C 50 70, 14 72, 8 68 Z"
          fill={blue}
        />
        <path
          d="M8 56 C 30 50, 50 56, 60 60 L 60 68 C 48 70, 28 70, 8 68 Z"
          fill={green}
        />
        <path
          d="M8 48 C 28 44, 48 50, 60 54 L 60 60 C 50 56, 30 50, 8 56 Z"
          fill={yellow}
        />
      </svg>
      {variant !== "compact" && (
        <div className="flex flex-col leading-tight">
          <span className="font-display text-xl font-bold tracking-tight" style={{ color: blue }}>
            CDL
          </span>
          <span className="font-display text-sm font-semibold italic" style={{ color: green }}>
            Aracaju
          </span>
        </div>
      )}
    </div>
  );
}
