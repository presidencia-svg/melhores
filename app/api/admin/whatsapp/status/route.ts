import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin/auth";
import { verificarStatus } from "@/lib/zapi/client";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const status = await verificarStatus();
  return NextResponse.json(status);
}
