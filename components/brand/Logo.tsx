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
        width={isCompact ? 80 : 200}
        height={isCompact ? 24 : 60}
        className={cn(
          "object-contain",
          isCompact ? "h-7 w-auto" : "h-12 w-auto md:h-14",
          // variante "white" (fundo escuro): inverte cores e torna a logo branca
          isWhite
            ? "brightness-0 invert"
            // variantes claras: usa multiply pra eliminar o fundo branco do PNG
            : "mix-blend-multiply"
        )}
        priority
      />
    </div>
  );
}
