import Image from "next/image";
import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  variant?: "full" | "compact" | "white";
};

export function Logo({ className, variant = "full" }: LogoProps) {
  const isWhite = variant === "white";
  const isCompact = variant === "compact";
  const src = isWhite ? "/cdl-logo-white.png" : "/cdl-logo.png";

  return (
    <div className={cn("flex items-center", className)}>
      <Image
        src={src}
        alt="CDL Aracaju"
        width={isCompact ? 120 : 280}
        height={isCompact ? 36 : 84}
        className={cn(
          "object-contain",
          isCompact ? "h-9 w-auto" : "h-14 w-auto md:h-20"
        )}
        priority
      />
    </div>
  );
}
