import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin/auth";
import { getCurrentTenant } from "@/lib/tenant/resolver";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

// Sobe logo de empresa pro bucket 'cerimonia-logos'. Recebe FormData
// com 'logo' (File). Devolve URL publica pra UI persistir via PATCH em
// /api/admin/cerimonia-led/slides/[id].

const MAX_BYTES = 3 * 1024 * 1024;
const TIPOS_OK = new Set([
  "image/png",
  "image/jpeg",
  "image/svg+xml",
  "image/webp",
]);

export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const tenant = await getCurrentTenant();
  const formData = await req.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "FormData inválido" }, { status: 400 });
  }
  const file = formData.get("logo");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Arquivo 'logo' não enviado" },
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Arquivo maior que 3MB" },
      { status: 400 }
    );
  }
  if (!TIPOS_OK.has(file.type)) {
    return NextResponse.json(
      { error: "Formato não suportado (use PNG/JPG/SVG/WebP)" },
      { status: 400 }
    );
  }

  const ext =
    file.type === "image/png"
      ? "png"
      : file.type === "image/jpeg"
        ? "jpg"
        : file.type === "image/svg+xml"
          ? "svg"
          : "webp";
  const path = `${tenant.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const supabase = createSupabaseAdminClient();
  const arrayBuffer = await file.arrayBuffer();
  const { error: upErr } = await supabase.storage
    .from("cerimonia-logos")
    .upload(path, arrayBuffer, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });

  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 500 });
  }

  const { data: pub } = supabase.storage
    .from("cerimonia-logos")
    .getPublicUrl(path);

  return NextResponse.json({ url: pub.publicUrl });
}
