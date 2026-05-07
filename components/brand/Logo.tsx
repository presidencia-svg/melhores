import Image from "next/image";
import { cn } from "@/lib/utils";
import { tryGetCurrentTenant } from "@/lib/tenant/resolver";

type LogoProps = {
  className?: string;
  variant?: "full" | "compact" | "white";
};

// Server component — resolve o tenant atual via host e usa o logo dele
// quando configurado. Fallback pro CDL Aracaju (legacy + valor default).
export async function Logo({ className, variant = "full" }: LogoProps) {
  const isWhite = variant === "white";
  const isCompact = variant === "compact";

  const tenant = await tryGetCurrentTenant().catch(() => null);
  const tenantLogo = tenant?.logo_url ?? null;

  // Quando o tenant tem logo proprio, usa <img> normal (URL externa do
  // Supabase Storage — evita whitelist de dominios do next/image).
  if (tenantLogo) {
    return (
      <div className={cn("flex items-center", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={tenantLogo}
          alt={tenant?.nome ?? "Logo"}
          className={cn(
            "object-contain",
            isCompact ? "h-9 w-auto" : "h-14 w-auto md:h-20"
          )}
        />
      </div>
    );
  }

  // Fallback: logo CDL Aracaju empacotado em /public
  const src = isWhite ? "/cdl-logo-white.png" : "/cdl-logo.png";
  return (
    <div className={cn("flex items-center", className)}>
      <Image
        src={src}
        alt={tenant?.nome ?? "CDL Aracaju"}
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
