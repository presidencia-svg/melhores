import { NextResponse } from "next/server";
import { clearSuperSession } from "@/lib/super-admin/auth";

// Redireciona pra /super/login do mesmo host (sempre melhoresdoano.app.br
// porque super-admin so existe la, mas o req.url e' suficiente sem env var).
export async function POST(req: Request) {
  await clearSuperSession();
  return NextResponse.redirect(new URL("/super/login", req.url));
}
