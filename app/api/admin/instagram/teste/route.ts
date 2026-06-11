import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin/auth";

// Valida credenciais do Instagram Graph API SEM postar nada. Chama GET
// /{ig-business-id}?fields=username,name,profile_picture_url, followers_count.
// Se a chamada passa, INSTAGRAM_BUSINESS_ACCOUNT_ID + INSTAGRAM_PAGE_ACCESS_TOKEN
// estao corretos. Diagnostico puro — nao publica nada.

const IG_USER_ID = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID ?? "";
const PAGE_TOKEN = process.env.INSTAGRAM_PAGE_ACCESS_TOKEN ?? "";
const API_BASE = "https://graph.facebook.com/v19.0";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  if (!IG_USER_ID || !PAGE_TOKEN) {
    return NextResponse.json(
      {
        ok: false,
        configurado: false,
        motivo:
          "Variáveis de ambiente INSTAGRAM_BUSINESS_ACCOUNT_ID e/ou INSTAGRAM_PAGE_ACCESS_TOKEN não configuradas na Vercel.",
      },
      { status: 503 }
    );
  }

  try {
    const url = new URL(`${API_BASE}/${IG_USER_ID}`);
    url.searchParams.set(
      "fields",
      "username,name,profile_picture_url,followers_count,media_count"
    );
    url.searchParams.set("access_token", PAGE_TOKEN);

    const res = await fetch(url.toString(), { method: "GET" });
    const json = (await res.json()) as Record<string, unknown> & {
      error?: { message?: string; code?: number; fbtrace_id?: string };
    };

    if (!res.ok || json.error) {
      const e = json.error ?? {};
      return NextResponse.json(
        {
          ok: false,
          configurado: true,
          motivo: e.message ?? `HTTP ${res.status}`,
          codigo_fb: e.code ?? null,
          fbtrace_id: e.fbtrace_id ?? null,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      configurado: true,
      conta: {
        username: json.username ?? null,
        nome: json.name ?? null,
        foto: json.profile_picture_url ?? null,
        seguidores: json.followers_count ?? null,
        posts: json.media_count ?? null,
      },
    });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        configurado: true,
        motivo: e instanceof Error ? e.message : String(e),
      },
      { status: 502 }
    );
  }
}
