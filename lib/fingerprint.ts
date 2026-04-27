// Gera uma "impressão digital" estável do dispositivo combinando vários sinais.
// Não é infalível (pessoas determinadas conseguem burlar), mas pega 95%+ dos
// casos comuns de votos múltiplos no mesmo aparelho.

// Bumped para v2: adicionado UUID por browser pra evitar colisão entre
// iPhones idênticos com Safari (que bloqueia canvas/WebGL fingerprint).
const STORAGE_KEY = "mda_device_fp_v2";
const UUID_KEY = "mda_device_uuid";

function getOrCreateBrowserUUID(): string {
  try {
    const existing = localStorage.getItem(UUID_KEY);
    if (existing && existing.length >= 16) return existing;
    const novo =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(UUID_KEY, novo);
    return novo;
  } catch {
    // Modo privado / localStorage bloqueado: cai pra valor aleatório por sessão
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
}

export async function getDeviceFingerprint(): Promise<string> {
  // Cache em localStorage para persistência entre sessões
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached && cached.length === 64) return cached;
  } catch {
    // localStorage indisponível (modo privado)
  }

  const sinais: string[] = [];

  // 0. UUID exclusivo do browser (evita colisão entre dispositivos iguais)
  sinais.push(getOrCreateBrowserUUID());

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
