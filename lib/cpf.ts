import { createHash } from "node:crypto";

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function isValidCpf(value: string): boolean {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const calc = (slice: number): number => {
    let sum = 0;
    for (let i = 0; i < slice; i++) sum += parseInt(cpf[i]!, 10) * (slice + 1 - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };

  return calc(9) === parseInt(cpf[9]!, 10) && calc(10) === parseInt(cpf[10]!, 10);
}

export function formatCpf(value: string): string {
  const cpf = onlyDigits(value).slice(0, 11);
  if (cpf.length <= 3) return cpf;
  if (cpf.length <= 6) return `${cpf.slice(0, 3)}.${cpf.slice(3)}`;
  if (cpf.length <= 9) return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6)}`;
  return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9, 11)}`;
}

export function maskCpf(value: string): string {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11) return value;
  return `${cpf.slice(0, 3)}.***.***-${cpf.slice(9, 11)}`;
}

export function hashCpf(value: string): string {
  const salt = process.env.HASH_SALT ?? "";
  const cpf = onlyDigits(value);
  return createHash("sha256").update(`${salt}::${cpf}`).digest("hex");
}
