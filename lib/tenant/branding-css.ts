import type { Tenant } from "./types";

// Le tenant.cor_primaria + cor_secundaria e devolve um <style> CSS pra
// injetar no root layout, sobrescrevendo as CSS variables usadas pelas
// classes utilitarias (text-cdl-blue, bg-cdl-green, etc).
//
// Sem cores configuradas (ou tenant null) → retorna null, deixa o default
// da paleta editorial em globals.css.
//
// Validamos hex pra evitar XSS via injecao de CSS.

function isHex(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value.trim());
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!m) return null;
  const num = parseInt(m[1]!, 16);
  return { r: (num >> 16) & 0xff, g: (num >> 8) & 0xff, b: num & 0xff };
}

function adjust(hex: string, factor: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const ch = (c: number) =>
    Math.max(0, Math.min(255, Math.round(c * factor)));
  const toHex = (c: number) => c.toString(16).padStart(2, "0");
  return `#${toHex(ch(rgb.r))}${toHex(ch(rgb.g))}${toHex(ch(rgb.b))}`;
}

export function montarCssBranding(tenant: Tenant | null): string | null {
  if (!tenant) return null;
  const primaria = tenant.cor_primaria?.trim();
  const secundaria = tenant.cor_secundaria?.trim();

  const overrides: string[] = [];

  if (primaria && isHex(primaria)) {
    // Sobrescreve as vars-fonte (navy-*) que sao usadas direto nas paginas
    // publicas (/, /votar, etc). As aliases --cdl-blue-* seguem porque
    // sao definidas em globals.css como var(--navy-*).
    overrides.push(`--navy-800: ${primaria};`);
    overrides.push(`--navy-900: ${adjust(primaria, 0.7)};`);
    overrides.push(`--navy-700: ${adjust(primaria, 1.25)};`);
    // Tambem sobrescreve as aliases CDL diretamente caso alguem use
    // --cdl-blue sem passar pela var-fonte (cobertura defensiva)
    overrides.push(`--cdl-blue: ${primaria};`);
    overrides.push(`--cdl-blue-dark: ${adjust(primaria, 0.7)};`);
    overrides.push(`--cdl-blue-light: ${adjust(primaria, 1.25)};`);
  }
  if (secundaria && isHex(secundaria)) {
    // Sobrescreve --green-* (CTA/sucesso, usado em /votar) e --cdl-green-*
    overrides.push(`--green-600: ${secundaria};`);
    overrides.push(`--green-500: ${adjust(secundaria, 1.15)};`);
    overrides.push(`--cdl-green: ${secundaria};`);
    overrides.push(`--cdl-green-dark: ${adjust(secundaria, 0.75)};`);
  }

  if (overrides.length === 0) return null;

  return `:root { ${overrides.join(" ")} }`;
}
