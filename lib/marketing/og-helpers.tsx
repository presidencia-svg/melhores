import { readFile } from "node:fs/promises";
import path from "node:path";

let logoCached: string | null = null;
let logoWhiteCached: string | null = null;
const fontCache = new Map<string, ArrayBuffer>();

export async function getLogoDataUrl(): Promise<string> {
  if (logoCached) return logoCached;
  const logoPath = path.join(process.cwd(), "public", "cdl-logo.png");
  const buf = await readFile(logoPath);
  logoCached = `data:image/png;base64,${buf.toString("base64")}`;
  return logoCached;
}

export async function getLogoWhiteDataUrl(): Promise<string> {
  if (logoWhiteCached) return logoWhiteCached;
  const logoPath = path.join(process.cwd(), "public", "cdl-logo-white.png");
  const buf = await readFile(logoPath);
  logoWhiteCached = `data:image/png;base64,${buf.toString("base64")}`;
  return logoWhiteCached;
}

export async function loadGoogleFont(
  family: string,
  weight: number,
  italic: boolean
): Promise<ArrayBuffer> {
  const key = `${family}-${weight}-${italic ? "i" : "n"}`;
  const cached = fontCache.get(key);
  if (cached) return cached;

  const url = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}:ital,wght@${italic ? 1 : 0},${weight}`;
  // User-Agent antigo (pre-WOFF2) força Google Fonts a retornar TTF (Satori suporta)
  const css = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:6.0) Gecko/20100101 Firefox/6.0",
    },
  }).then((r) => r.text());

  const match =
    css.match(/url\((.+?)\)\s*format\(['"]truetype['"]\)/) ??
    css.match(/url\((.+?)\)/);
  if (!match) throw new Error(`font not found: ${family} ${weight}${italic ? " italic" : ""}`);

  const data = await fetch(match[1]).then((r) => r.arrayBuffer());
  fontCache.set(key, data);
  return data;
}

export async function loadEditorialFonts() {
  const [fraunces300i, fraunces800i, sora500, sora700] = await Promise.all([
    loadGoogleFont("Fraunces", 300, true),
    loadGoogleFont("Fraunces", 800, true),
    loadGoogleFont("Sora", 500, false),
    loadGoogleFont("Sora", 700, false),
  ]);

  return [
    { name: "Fraunces", data: fraunces300i, weight: 300 as const, style: "italic" as const },
    { name: "Fraunces", data: fraunces800i, weight: 800 as const, style: "italic" as const },
    { name: "Sora", data: sora500, weight: 500 as const, style: "normal" as const },
    { name: "Sora", data: sora700, weight: 700 as const, style: "normal" as const },
  ];
}
