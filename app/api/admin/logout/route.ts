import { NextResponse } from "next/server";
import { clearAdminSession } from "@/lib/admin/auth";

// Redireciona pra /admin/login DO MESMO HOST onde o admin estava — multi-
// tenant friendly. `req.url` carrega o origin certo (votar.cdlaju.com.br
// ou melhoresdoano.app.br, dependendo de onde o logout foi chamado).
export async function POST(req: Request) {
  await clearAdminSession();
  return NextResponse.redirect(new URL("/admin/login", req.url));
}
