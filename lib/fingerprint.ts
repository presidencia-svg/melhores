// Gera uma "impressão digital" estável do dispositivo combinando vários sinais.
// Não é infalível (pessoas determinadas conseguem burlar), mas pega 95%+ dos
// casos comuns de votos múltiplos no mesmo aparelho.

const STORAGE_KEY = "mda_device_fp";

export async function getDeviceFingerprint(): Promise<string> {
  // Cache em localStorage para persistência entre sessões
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached && cached.length === 64) return cached;
  } catch {
    // localStorage indisponível (modo privado)
  }

  const sinais: string[] = [];

  // 1. User Agent
  sinais.push(navigator.userAgent);

  // 2. Idioma + plataforma
  sinais.push(navigator.language);
  sinais.push(navigator.platform ?? "");

  // 3. Tela
  sinais.push(`${screen.width}x${screen.height}@${window.devicePixelRatio}`);

  // 4. Timezone
  try {
    sinais.push(Intl.DateTimeFormat().resolvedOptions().timeZone ?? "");
  } catch {
    sinais.push("");
  }

  // 5. Hardware
  sinais.push(String(navigator.hardwareConcurrency ?? 0));
  // @ts-expect-error - propriedade não tipada mas existente
  sinais.push(String(navigator.deviceMemory ?? 0));

  // 6. Canvas fingerprint
  try {
    sinais.push(canvasFingerprint());
  } catch {
    sinais.push("");
  }

  // 7. WebGL renderer
  try {
    sinais.push(webglFingerprint());
  } catch {
    sinais.push("");
  }

  const raw = sinais.join("|");
  const hash = await sha256(raw);

  try {
    localStorage.setItem(STORAGE_KEY, hash);
  } catch {
    // ignore
  }

  return hash;
}

function canvasFingerprint(): string {
  const canvas = document.createElement("canvas");
  canvas.width = 220;
  canvas.height = 60;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  ctx.textBaseline = "top";
  ctx.font = "16px 'Arial'";
  ctx.fillStyle = "#1B3A7A";
  ctx.fillRect(125, 1, 62, 20);
  ctx.fillStyle = "#fff";
  ctx.fillText("CDL Aracaju 🏆", 2, 15);
  ctx.fillStyle = "rgba(255, 215, 0, 0.7)";
  ctx.fillText("Melhores 2026", 4, 35);

  return canvas.toDataURL().slice(-128);
}

function webglFingerprint(): string {
  const canvas = document.createElement("canvas");
  const gl =
    (canvas.getContext("webgl") as WebGLRenderingContext | null) ??
    (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);
  if (!gl) return "";

  const ext = gl.getExtension("WEBGL_debug_renderer_info");
  if (!ext) return gl.getParameter(gl.VERSION) ?? "";

  const vendor = gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) ?? "";
  const renderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) ?? "";
  return `${vendor}|${renderer}`;
}

async function sha256(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
