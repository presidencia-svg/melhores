// ==========================================================================
// Cliente da Instagram Graph API pra postar carrosseis no @cdlaju.
//
// Fluxo (3 passos):
//   1. Pra cada imagem: cria item-container (POST /{ig-id}/media)
//   2. Cria carousel container (POST /{ig-id}/media com media_type=CAROUSEL)
//   3. Publica (POST /{ig-id}/media_publish)
//
// IG nao aceita upload direto de bytes — todas as imagens precisam estar em
// URLs publicas alcancaveis. Usamos Supabase Storage bucket 'instagram-posts'.
// ==========================================================================

const IG_USER_ID = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID!;
const PAGE_TOKEN = process.env.INSTAGRAM_PAGE_ACCESS_TOKEN!;
const API_BASE = "https://graph.facebook.com/v19.0";

type FbError = { error?: { message?: string; code?: number; type?: string } };

async function fbPost(
  path: string,
  data: Record<string, string | undefined>
): Promise<Record<string, unknown>> {
  const body = new URLSearchParams({
    access_token: PAGE_TOKEN,
    ...Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== undefined)
    ),
  } as Record<string, string>);
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    body,
  });
  const json = (await res.json()) as Record<string, unknown> & FbError;
  if (!res.ok || json.error) {
    throw new Error(
      `IG ${path} failed: ${json.error?.message ?? res.statusText}`
    );
  }
  return json;
}

async function fbGet(path: string): Promise<Record<string, unknown>> {
  const url = `${API_BASE}${path}${path.includes("?") ? "&" : "?"}access_token=${PAGE_TOKEN}`;
  const res = await fetch(url);
  const json = (await res.json()) as Record<string, unknown> & FbError;
  if (!res.ok || json.error) {
    throw new Error(
      `IG GET ${path} failed: ${json.error?.message ?? res.statusText}`
    );
  }
  return json;
}

// Cria um item-container pra cada imagem do carrossel.
async function criarItemContainer(imageUrl: string): Promise<string> {
  const r = await fbPost(`/${IG_USER_ID}/media`, {
    image_url: imageUrl,
    is_carousel_item: "true",
  });
  return r.id as string;
}

// Cria o container do carrossel agrupando os children.
async function criarCarrossel(
  childrenIds: string[],
  caption: string
): Promise<string> {
  const r = await fbPost(`/${IG_USER_ID}/media`, {
    media_type: "CAROUSEL",
    children: childrenIds.join(","),
    caption,
  });
  return r.id as string;
}

// Aguarda o container ficar com status FINISHED. Carrossel pode levar
// alguns segundos. 60s de timeout e' confortavel.
async function aguardarPronto(containerId: string, timeoutMs = 60_000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const r = await fbGet(`/${containerId}?fields=status_code`);
    const status = r.status_code as string;
    if (status === "FINISHED") return;
    if (status === "ERROR") {
      throw new Error(`Container ${containerId} terminou em ERROR`);
    }
    await new Promise((res) => setTimeout(res, 3000));
  }
  throw new Error(`Container ${containerId} timeout apos ${timeoutMs}ms`);
}

// Publica o carrossel. Retorna o ID do post (pra montar o permalink).
async function publicar(containerId: string): Promise<string> {
  const r = await fbPost(`/${IG_USER_ID}/media_publish`, {
    creation_id: containerId,
  });
  return r.id as string;
}

// Pega o permalink do post pra retornar ao cliente.
async function getPermalink(postId: string): Promise<string | null> {
  try {
    const r = await fbGet(`/${postId}?fields=permalink`);
    return (r.permalink as string) ?? null;
  } catch {
    return null;
  }
}

export type PostarCarrosselResultado = {
  postId: string;
  permalink: string | null;
};

// Funcao principal. Recebe URLs publicas (Supabase Storage) + caption
// e devolve o ID do post + permalink.
export async function postarCarrossel(
  imageUrls: string[],
  caption: string
): Promise<PostarCarrosselResultado> {
  if (imageUrls.length < 2) {
    throw new Error("Carrossel precisa de no minimo 2 imagens");
  }
  if (imageUrls.length > 10) {
    throw new Error("Carrossel aceita no maximo 10 imagens");
  }
  if (!IG_USER_ID || !PAGE_TOKEN) {
    throw new Error(
      "Credenciais do Instagram nao configuradas (env INSTAGRAM_BUSINESS_ACCOUNT_ID / INSTAGRAM_PAGE_ACCESS_TOKEN)"
    );
  }

  // 1. Cria 1 container por imagem (em paralelo — IG aguenta)
  const childrenIds = await Promise.all(
    imageUrls.map((url) => criarItemContainer(url))
  );

  // 2. Cria carrossel
  const carouselId = await criarCarrossel(childrenIds, caption);

  // 3. Aguarda processar
  await aguardarPronto(carouselId);

  // 4. Publica
  const postId = await publicar(carouselId);

  // 5. Pega o permalink (best-effort, nao falha se der timing)
  const permalink = await getPermalink(postId);

  return { postId, permalink };
}
