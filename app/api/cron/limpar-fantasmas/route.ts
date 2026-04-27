import { NextResponse } from "next/server";

// DESATIVADO em 2026-04-27 apos incidente.
//
// Bug: o filtro .in("votante_id", ids) era truncado em 1000 linhas pelo
// PostgREST. Quando o total de votos passava de 1000, votantes legitimos
// nao apareciam em comVoto e eram apagados como "fantasmas".
//
// Manter desligado ate reescrever a deteccao server-side (ex.: SQL com
// NOT EXISTS, ou paginar votos com .range()).

export const maxDuration = 60;

function autorizado(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!autorizado(req)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  return NextResponse.json({
    ok: true,
    desativado: true,
    motivo: "Bug de truncamento do PostgREST em .in() — apagava votantes com voto",
    removidos: 0,
  });
}
