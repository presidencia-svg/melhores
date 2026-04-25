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
        width={isCompact ? 48 : 160}
        height={isCompact ? 48 : 56}
        className={cn(
          "object-contain",
          isCompact ? "h-12 w-12" : "h-12 w-auto",
          isWhite && "brightness-0 invert"
        )}
        priority
      />
    </div>
  );
}
