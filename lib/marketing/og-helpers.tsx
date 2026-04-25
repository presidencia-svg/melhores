import { readFile } from "node:fs/promises";
import path from "node:path";

let cached: string | null = null;

export async function getLogoDataUrl(): Promise<string> {
  if (cached) return cached;
  const logoPath = path.join(process.cwd(), "public", "cdl-logo.png");
  const buf = await readFile(logoPath);
  cached = `data:image/png;base64,${buf.toString("base64")}`;
  return cached;
}
