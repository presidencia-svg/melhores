import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { postarCarrossel } from "@/lib/instagram/post";

// Carrossel de 2-10 imagens em base64 + caption.
// Servidor faz upload pro bucket 'instagram-posts' do Supabase Storage,
// pega URL publica, e dispara o fluxo de 3 passos da Instagram Graph API.
const Body = z.object({
  imagens: z
    .array(z.string().regex(/^data:image\/(png|jpeg);base64,/))
    .min(2)
    .max(10),
  caption: z.string().min(1).max(2200), // limite IG e' 2200 chars
});

export const maxDuration = 300; // 5 min — carrossel pode demorar

export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", detail: parsed.error.format() },
      { status: 400 }
    );
  }

  const { imagens, caption } = parsed.data;
  const supabase = createSupabaseAdminClient();
  const slug = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const urls: string[] = [];

  // Upload de cada imagem pro Supabase Storage
  try {
    for (let i = 0; i < imagens.length; i++) {
      const dataUrl = imagens[i]!;
      const match = dataUrl.match(/^data:image\/(png|jpeg);base64,(.+)$/);
      if (!match) throw new Error(`imagem ${i + 1} invalida`);
      const ext = match[1] === "png" ? "png" : "jpg";
      const buf = Buffer.from(match[2]!, "base64");
      const path = `carrosseis/${slug}/${String(i + 1).padStart(2, "0")}.${ext}`;

      const { error } = await supabase.storage
        .from("instagram-posts")
        .upload(path, buf, {
          contentType: `image/${match[1]}`,
          upsert: false,
        });
      if (error) throw new Error(`upload imagem ${i + 1}: ${error.message}`);

      const { data: pub } = supabase.storage
        .from("instagram-posts")
        .getPublicUrl(path);
      urls.push(pub.publicUrl);
    }
  } catch (e) {
    return NextResponse.json(
      {
        error: "Falha no upload das imagens",
        detail: e instanceof Error ? e.message : String(e),
      },
      { status: 500 }
    );
  }

  // Posta o carrossel via Instagram Graph API
  try {
    const resultado = await postarCarrossel(urls, caption);
    return NextResponse.json({
      ok: true,
      postId: resultado.postId,
      permalink: resultado.permalink,
      uploadedUrls: urls,
    });
  } catch (e) {
    return NextResponse.json(
      {
        error: "Falha ao publicar no Instagram",
        detail: e instanceof Error ? e.message : String(e),
        uploadedUrls: urls,
      },
      { status: 500 }
    );
  }
}
