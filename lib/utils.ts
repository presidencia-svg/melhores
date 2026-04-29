import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return headers.get("x-real-ip") ?? "0.0.0.0";
}

export function normalizarNome(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

// Mascara o numero pra UI: deixa visivel DDI + DDD + 4 ultimos digitos.
// Ex: '5579999241234' -> '+55 79 *****-1234'
export function mascararWhatsapp(numero: string | null | undefined): string {
  if (!numero) return "";
  const digits = numero.replace(/\D/g, "");
  if (digits.length < 6) return digits;
  const ultimos = digits.slice(-4);
  if (digits.startsWith("55") && digits.length >= 12) {
    const ddd = digits.slice(2, 4);
    return `+55 ${ddd} *****-${ultimos}`;
  }
  return `*****-${ultimos}`;
}
