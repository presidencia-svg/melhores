import { NextResponse } from "next/server";

// GET /api/debug/env — TEMPORÁRIO: remove após investigação.
// Hardcoded debug token até descobrirmos as env vars.
const DEBUG_TOKEN = "debug-cdlaju-melhores-2026-temp";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const key = url.searchParams.get("key");
  if (key !== DEBUG_TOKEN) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const required = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "SPC_API_URL",
    "SPC_USER",
    "SPC_PASSWORD",
    "SPC_AMBIENTE",
    "SPC_CODIGO_PRODUTO",
    "ZAPI_INSTANCE_ID",
    "ZAPI_TOKEN",
    "ZAPI_CLIENT_TOKEN",
    "ADMIN_PASSWORD",
    "JWT_SECRET",
    "HASH_SALT",
    "NEXT_PUBLIC_APP_URL",
  ];

  const status: Record<string, { presente: boolean; tamanho: number; preview: string }> = {};
  for (const k of required) {
    const v = process.env[k] ?? "";
    status[k] = {
      presente: v.length > 0,
      tamanho: v.length,
      preview: v.length > 0 ? `${v.slice(0, 8)}...${v.slice(-4)}` : "—",
    };
  }

  return NextResponse.json({
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL ?? "no",
    REGION: process.env.VERCEL_REGION ?? "?",
    env: status,
  });
}
