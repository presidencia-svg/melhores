import { NextResponse } from "next/server";
import { z } from "zod";
import { getVotanteSessao } from "@/lib/sessao";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const Body = z.object({ image: z.string().startsWith("data:image/") });
const BUCKET = "selfies";

export async function POST(req: Request) {
  const sessao = await getVotanteSessao();
  if (!sessao) {
    return NextResponse.json({ error: "Sessão expirada. Recomece a votação." }, { status: 401 });
  }

  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Imagem inválida" }, { status: 400 });
  }

  const dataUrl = parsed.data.image;
  const match = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) return NextResponse.json({ error: "Formato inválido" }, { status: 400 });
  const mime = match[1]!;
  const base64 = match[2]!;
  const bytes = Buffer.from(base64, "base64");

  if (bytes.length > 3_000_000) {
    return NextResponse.json({ error: "Imagem muito grande (máx 3MB)" }, { status: 413 });
  }

  const supabase = createSupabaseAdminClient();
  const ext = mime === "image/png" ? "png" : "jpg";
  const path = `${sessao.id}/${Date.now()}.${ext}`;

  const upload = await supabase.storage.from(BUCKET).upload(path, bytes, {
    contentType: mime,
    upsert: false,
  });

  if (upload.error) {
    return NextResponse.json(
      { error: "Falha ao salvar selfie", detalhe: upload.error.message },
      { status: 500 }
    );
  }

  await supabase
    .from("votantes")
    .update({ selfie_url: path })
    .eq("id", sessao.id);

  return NextResponse.json({ ok: true });
}
