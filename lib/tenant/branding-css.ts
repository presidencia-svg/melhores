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
    overrides.push(`--cdl-blue: ${primaria};`);
    overrides.push(`--cdl-blue-dark: ${adjust(primaria, 0.7)};`);
    overrides.push(`--cdl-blue-light: ${adjust(primaria, 1.25)};`);
  }
  if (secundaria && isHex(secundaria)) {
    overrides.push(`--cdl-green: ${secundaria};`);
    overrides.push(`--cdl-green-dark: ${adjust(secundaria, 0.75)};`);
  }

  if (overrides.length === 0) return null;

  return `:root { ${overrides.join(" ")} }`;
}
