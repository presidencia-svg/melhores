import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin/auth";
import { verificarStatus } from "@/lib/zapi/client";
import { verificarStatusMeta } from "@/lib/meta-whatsapp/client";
import { zenviaConfigurada } from "@/lib/sms/zenvia";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const [meta, zapi] = await Promise.all([
    verificarStatusMeta(),
    verificarStatus(),
  ]);
  const sms = zenviaConfigurada();
  // Canal ativo (qual será usado nos disparos): Meta > Z-API > SMS
  const canalAtivo = meta.conectada
    ? "meta"
    : zapi.conectado
      ? "zapi"
      : sms
        ? "sms"
        : null;
  return NextResponse.json({
    meta,
    zapi: { conectado: zapi.conectado, detalhe: zapi.detalhe },
    sms: { configurada: sms },
    canal_ativo: canalAtivo,
    // Compat com versão anterior (StatusBanner): mantém os campos antigos
    conectado: meta.conectada || zapi.conectado,
    detalhe: meta.detalhe ?? zapi.detalhe,
  });
}
