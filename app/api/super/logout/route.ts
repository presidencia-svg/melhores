import { NextResponse } from "next/server";
import { clearSuperSession } from "@/lib/super-admin/auth";

export async function POST() {
  await clearSuperSession();
  return NextResponse.redirect(new URL("/super/login", process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"));
}
