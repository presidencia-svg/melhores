import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin/auth";
import { fetchMetaInsights } from "@/lib/meta-whatsapp/insights";

// Debug endpoint pra inspecionar exatamente o que a Meta API retorna —
// usado quando os custos aparecem zerados na pagina de insights.
//
// Uso: GET /api/admin/meta-debug?dias=7
export async function GET(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const url = new URL(req.url);
  const dias = Math.min(90, Math.max(1, parseInt(url.searchParams.get("dias") ?? "7", 10) || 7));

  const insights = await fetchMetaInsights(dias, { debug: true });

  if (!insights) {
    return NextResponse.json({
      error: "META_WABA_ID ou META_WHATSAPP_TOKEN nao configurados",
    });
  }

  return NextResponse.json(
    {
      summary: {
        days: dias,
        conversations_total: insights.conversations.total,
        conversations_total_cost: insights.conversations.total_cost,
        by_category: insights.conversations.by_category,
        templates_count: insights.templates.length,
        sent_total: insights.templates.reduce((a, t) => a + t.sent, 0),
      },
      errors: insights.errors,
      raw: {
        conversation_response: insights.raw_conversation_response,
        template_response: insights.raw_template_response,
      },
      env: {
        api_version: process.env.META_API_VERSION || "v21.0",
        currency: process.env.META_CURRENCY || "USD",
      },
    },
    { status: 200 }
  );
}
