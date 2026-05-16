import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin/auth";
import { getCurrentTenant } from "@/lib/tenant/resolver";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

// Recebe FormData com 'foto' (File). Sobe pro bucket 'candidato-fotos'
// e retorna a URL publica. UI usa essa URL pra preencher o campo
// foto_url do candidato (POST /api/admin/candidatos).

const MAX_BYTES = 3 * 1024 * 1024; // 3MB
const TIPOS_OK = new Set(["image/png", "image/jpeg", "image/webp"]);

export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const tenant = await getCurrentTenant();
  const formData = await req.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "FormData inválido" }, { status: 400 });
  }

  const file = formData.get("foto");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Arquivo 'foto' não enviado" },
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
      { error: "Formato não suportado (use PNG, JPG ou WebP)" },
      { status: 400 }
    );
  }

  const ext =
    file.type === "image/png"
      ? "png"
      : file.type === "image/jpeg"
        ? "jpg"
        : "webp";
  const path = `${tenant.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const supabase = createSupabaseAdminClient();
  const arrayBuffer = await file.arrayBuffer();
  const { error: upErr } = await supabase.storage
    .from("candidato-fotos")
    .upload(path, arrayBuffer, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });

  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 500 });
  }

  const { data: pub } = supabase.storage
    .from("candidato-fotos")
    .getPublicUrl(path);

  return NextResponse.json({ url: pub.publicUrl });
}
