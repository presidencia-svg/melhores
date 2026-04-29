// Detecta janelas anônimas/privadas. Não é à prova de bala — usuário
// determinado pode burlar — mas barra a maioria dos casos casuais
// (Chrome incognito, Safari private, Firefox private).

// Chrome incognito limita storage quota a uma fração da memória do device.
// Em condicoes normais o quota fica em GBs; em incognito, sub-GB tipicamente.
async function chromeIncognito(): Promise<boolean> {
  if (typeof navigator === "undefined") return false;
  if (!("storage" in navigator) || !navigator.storage?.estimate) return false;
  try {
    const { quota } = await navigator.storage.estimate();
    if (typeof quota !== "number") return false;
    // Threshold conservador: 1GB. Quota normal em Chrome desktop é tipicamente
    // 60% do disco livre (>10GB). Em incognito, fica em centenas de MB.
    return quota < 1_073_741_824;
  } catch {
    return false;
  }
}

// Safari Private (e WebKit em geral): writes em IndexedDB falham silenciosamente
// ou throw. Testamos abrindo um DB e tentando uma transacao.
function safariPrivate(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof indexedDB === "undefined") return resolve(false);

    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
    const isWebKit = /Safari/i.test(ua) && !/Chrome|CriOS|Edg/i.test(ua);
    if (!isWebKit) return resolve(false);

    let resolved = false;
    const finish = (val: boolean) => {
      if (!resolved) {
        resolved = true;
        resolve(val);
      }
    };

    try {
      const req = indexedDB.open("__priv_check__", 1);
      req.onerror = () => finish(true);
      req.onsuccess = () => {
        try {
          req.result.close();
          indexedDB.deleteDatabase("__priv_check__");
        } catch {
          // ignora
        }
        finish(false);
      };
      // Safari private: em alguns casos o open succede mas o evento nunca
      // dispara — timeout de 1.5s assume normal se nada respondeu.
      setTimeout(() => finish(false), 1500);
    } catch {
      finish(true);
    }
  });
}

// Firefox Private: localStorage funciona mas é volátil. Detecção menos
// confiavel — fallback é checar se localStorage persiste apos reload (nao
// dá pra fazer aqui). Usamos heurística do quota tambem.
async function firefoxPrivate(): Promise<boolean> {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent ?? "";
  if (!/Firefox/i.test(ua)) return false;
  if (!("storage" in navigator) || !navigator.storage?.estimate) return false;
  try {
    const { quota } = await navigator.storage.estimate();
    // Firefox privado: quota tipicamente cap em ~10MB
    return typeof quota === "number" && quota < 120_000_000;
  } catch {
    return false;
  }
}

export async function isPrivateMode(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const [chrome, safari, firefox] = await Promise.all([
      chromeIncognito(),
      safariPrivate(),
      firefoxPrivate(),
    ]);
    return chrome || safari || firefox;
  } catch {
    return false;
  }
}
