import { scrypt, randomBytes, timingSafeEqual } from "node:crypto";

// Formato do hash armazenado: "<saltHex>:<keyHex>".
// scrypt do Node.js — KDF moderno, sem dep externa.

const KEY_LEN = 64;

export async function hashSenha(senha: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derivedKey: Buffer = await new Promise((res, rej) => {
    scrypt(senha, salt, KEY_LEN, (err, key) => {
      if (err) return rej(err);
      res(key);
    });
  });
  return `${salt}:${derivedKey.toString("hex")}`;
}

export async function verificarSenhaHash(
  senha: string,
  hash: string
): Promise<boolean> {
  const idx = hash.indexOf(":");
  if (idx <= 0) return false;
  const salt = hash.slice(0, idx);
  const expectedKeyHex = hash.slice(idx + 1);
  if (!salt || !expectedKeyHex) return false;
  let expectedKey: Buffer;
  try {
    expectedKey = Buffer.from(expectedKeyHex, "hex");
  } catch {
    return false;
  }
  if (expectedKey.length !== KEY_LEN) return false;

  const derivedKey: Buffer = await new Promise((res, rej) => {
    scrypt(senha, salt, KEY_LEN, (err, key) => {
      if (err) return rej(err);
      res(key);
    });
  });
  if (derivedKey.length !== expectedKey.length) return false;
  return timingSafeEqual(derivedKey, expectedKey);
}
