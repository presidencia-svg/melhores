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

// Embaralha um array de forma deterministica a partir de uma seed string.
// Mesma seed = mesma ordem (Fisher-Yates com PRNG mulberry32 hashada).
// Util pra exibir categorias/subs em ordem aleatoria mas estavel pra cada votante,
// evitando viés de "primeiro alfabetico recebe mais voto".
export function seededShuffle<T>(arr: readonly T[], seed: string): T[] {
  const out = arr.slice();
  if (out.length <= 1) return out;

  // Hash string -> uint32 (FNV-1a)
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }

  // PRNG determinístico (mulberry32)
  const rand = () => {
    h = (h + 0x6d2b79f5) >>> 0;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
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
