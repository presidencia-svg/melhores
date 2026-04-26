import Image from "next/image";
import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  variant?: "full" | "compact" | "white";
};

export function Logo({ className, variant = "full" }: LogoProps) {
  const isWhite = variant === "white";
  const isCompact = variant === "compact";

  return (
    <div className={cn("flex items-center", className)}>
      <Image
        src="/cdl-logo.png"
        alt="CDL Aracaju"
        width={isCompact ? 80 : 240}
        height={isCompact ? 24 : 72}
        className={cn(
          "object-contain",
          isCompact ? "h-8 w-auto" : "h-14 w-auto md:h-16",
          isWhite && "brightness-0 invert"
        )}
        priority
      />
    </div>
  );
}
