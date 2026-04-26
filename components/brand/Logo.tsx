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
        width={isCompact ? 120 : 280}
        height={isCompact ? 36 : 84}
        className={cn(
          "object-contain",
          isCompact ? "h-9 w-auto" : "h-16 w-auto md:h-20",
          // variante "white" (fundo escuro): inverte cores e torna a logo branca
          isWhite && "brightness-0 invert"
        )}
        priority
      />
    </div>
  );
}
