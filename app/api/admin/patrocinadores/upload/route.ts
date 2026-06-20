import { NextResponse } from "next/server";
import { getAdminTenantOuNull } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const MAX_BYTES = 2 * 1024 * 1024;
const TIPOS_OK = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
]);

export async function POST(req: Request) {
  const tenant = await getAdminTenantOuNull();
  if (!tenant) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const formData = await req.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "FormData inválido" }, { status: 400 });
  }

  const file = formData.get("logo");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Arquivo 'logo' não enviado" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Arquivo maior que 2MB" }, { status: 400 });
  }
  if (!TIPOS_OK.has(file.type)) {
    return NextResponse.json(
      { error: "Formato não suportado (use PNG, JPG, WebP ou SVG)" },
      { status: 400 }
    );
  }

  const ext =
    file.type === "image/png"
      ? "png"
      : file.type === "image/jpeg"
        ? "jpg"
        : file.type === "image/webp"
          ? "webp"
          : "svg";

  // Path por tenant — evita colisão entre tenants e facilita auditoria.
  const path = `${tenant.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const supabase = createSupabaseAdminClient();
  const arrayBuffer = await file.arrayBuffer();

  const { error: upErr } = await supabase.storage
    .from("patrocinadores-logos")
    .upload(path, arrayBuffer, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });
  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 500 });
  }

  const { data: pub } = supabase.storage
    .from("patrocinadores-logos")
    .getPublicUrl(path);

  return NextResponse.json({ url: pub.publicUrl });
}
