import { NextResponse } from "next/server";
import { z } from "zod";
import { isSuperAdmin } from "@/lib/super-admin/auth";
import { creditarCredito } from "@/lib/creditos";

const Body = z.object({
  tenant_id: z.string().uuid(),
  valor_centavos: z.number().int().min(1).max(100000000),
  descricao: z.string().max(200).optional(),
});

export async function POST(req: Request) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  try {
    const result = await creditarCredito({
      tenantId: parsed.data.tenant_id,
      valorCentavos: parsed.data.valor_centavos,
      motivo: "cortesia",
      descricao: parsed.data.descricao ?? "Crédito cortesia (super-admin)",
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Falha" },
      { status: 500 }
    );
  }
}
