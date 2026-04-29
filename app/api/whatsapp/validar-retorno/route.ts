import { NextResponse } from "next/server";
import { z } from "zod";
import {
  clearPreRetorno,
  getPreRetorno,
  setVotanteSessao,
} from "@/lib/sessao";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const Body = z.object({ codigo: z.string().length(6) });

// Valida o OTP do votante de retorno e cria sessao completa pra ele
// continuar votando nas subcategorias que faltam.
export async function POST(req: Request) {
  const votanteId = await getPreRetorno();
  if (!votanteId) {
    return NextResponse.json({ error: "Sessão expirada" }, { status: 401 });
  }

  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Código inválido" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  const { data: registro } = await supabase
    .from("whatsapp_codigos")
    .select("id, codigo, tentativas, validado, expira_em")
    .eq("votante_id", votanteId)
    .eq("validado", false)
    .order("criado_em", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!registro) {
    return NextResponse.json(
      { error: "Solicite um novo código." },
      { status: 400 }
    );
  }

  if (new Date(registro.expira_em) < new Date()) {
    return NextResponse.json(
      { error: "Código expirado. Solicite um novo." },
      { status: 410 }
    );
  }

  if (registro.tentativas >= 5) {
    return NextResponse.json(
      { error: "Tentativas excedidas. Solicite novo código." },
      { status: 429 }
    );
  }

  if (registro.codigo !== parsed.data.codigo) {
    await supabase
      .from("whatsapp_codigos")
      .update({ tentativas: registro.tentativas + 1 })
      .eq("id", registro.id);
    return NextResponse.json({ error: "Código incorreto." }, { status: 400 });
  }

  // OTP ok: marca codigo como validado, cria sessao completa e limpa pre-retorno.
  // Nao precisa atualizar votantes.whatsapp_validado (ja era true).
  await supabase
    .from("whatsapp_codigos")
    .update({ validado: true })
    .eq("id", registro.id);

  await setVotanteSessao(votanteId);
  await clearPreRetorno();

  return NextResponse.json({ ok: true });
}
