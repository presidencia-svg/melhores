import { NextResponse } from "next/server";
import { z } from "zod";
import {
  clearPreCadastro,
  getPreCadastro,
  getVotanteSessao,
  setVotanteSessao,
} from "@/lib/sessao";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getClientIp } from "@/lib/utils";

const Body = z.object({ image: z.string().startsWith("data:image/") });
const BUCKET = "selfies";
const MAX_CPFS_POR_DISPOSITIVO = 5;

export async function POST(req: Request) {
  // Caminho A: votante já existe (retomada). Caminho B: vem do pre-cadastro.
  const sessao = await getVotanteSessao();
  const pre = sessao ? null : await getPreCadastro();
  if (!sessao && !pre) {
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
  const ip = getClientIp(req.headers);
  const userAgent = req.headers.get("user-agent") ?? "";

  // Se ainda não há votante criado, cria agora a partir do pre-cadastro.
  // Re-checa unicidade (CPF e fingerprint) pra cobrir corrida entre abas.
  let votanteId: string;
  if (sessao) {
    votanteId = sessao.id;
  } else {
    const p = pre!;

    const { data: jaExiste } = await supabase
      .from("votantes")
      .select("id")
      .eq("edicao_id", p.edicao_id)
      .eq("cpf_hash", p.cpf_hash)
      .maybeSingle();
    if (jaExiste) {
      await clearPreCadastro();
      return NextResponse.json(
        { error: "Este CPF já participou da votação." },
        { status: 409 }
      );
    }

    if (p.fingerprint) {
      const { count: usados } = await supabase
        .from("votantes")
        .select("*", { head: true, count: "exact" })
        .eq("edicao_id", p.edicao_id)
        .eq("device_fingerprint", p.fingerprint);
      if ((usados ?? 0) >= MAX_CPFS_POR_DISPOSITIVO) {
        await clearPreCadastro();
        return NextResponse.json(
          {
            error: `Limite de ${MAX_CPFS_POR_DISPOSITIVO} votantes por dispositivo atingido.`,
          },
          { status: 429 }
        );
      }
    }

    const { data: novo, error: insertErr } = await supabase
      .from("votantes")
      .insert({
        edicao_id: p.edicao_id,
        cpf_hash: p.cpf_hash,
        cpf: p.cpf,
        nome: p.nome,
        nome_autodeclarado: p.nome_autodeclarado,
        spc_validado: p.spc_validado,
        ip,
        user_agent: userAgent,
        device_fingerprint: p.fingerprint,
      })
      .select("id")
      .single();
    if (insertErr || !novo) {
      return NextResponse.json({ error: "Falha ao registrar votante" }, { status: 500 });
    }
    votanteId = novo.id;
    await setVotanteSessao(votanteId);
  }

  const ext = mime === "image/png" ? "png" : "jpg";
  const path = `${votanteId}/${Date.now()}.${ext}`;

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
    .eq("id", votanteId);

  await clearPreCadastro();

  return NextResponse.json({ ok: true });
}
