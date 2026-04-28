// Insights consolidados da Meta Cloud API:
// - qualidade dos numeros (quality_rating, tier, throughput)
// - template_analytics (sent/delivered/read/clicked por template no periodo)
// - conversation_analytics (volume + custo por categoria, serie diaria)
//
// Resiliente: se META_WABA_ID nao estiver configurado, retorna null e a UI
// mostra so dados internos do Supabase.

const META_API_VERSION = process.env.META_API_VERSION || "v21.0";

export interface PhoneStatus {
  id: string;
  display_phone_number?: string;
  verified_name?: string;
  quality_rating?: string;
  name_status?: string;
  messaging_limit_tier?: string;
  throughput?: { level?: string };
  error?: string;
}

export interface TemplateAgg {
  template_id: string;
  name: string;
  category: string;
  sent: number;
  delivered: number;
  read: number;
  clicked: number;
}

export interface CategoryAgg {
  category: string;
  conversation: number;
  cost: number;
}

export interface DailyConversationPoint {
  date: string;
  conversations: number;
  cost: number;
}

export interface MetaInsights {
  phone_status: PhoneStatus[];
  templates: TemplateAgg[];
  conversations: {
    total: number;
    total_cost: number;
    by_category: CategoryAgg[];
    daily: DailyConversationPoint[];
  };
  errors: { template_analytics?: string; conversation_analytics?: string; templates_list?: string };
}

interface TemplateAnalyticsPoint {
  template_id: string;
  start: number;
  end: number;
  sent?: number;
  delivered?: number;
  read?: number;
  clicked?: Array<{ type: string; count: number }>;
}

interface ConversationAnalyticsPoint {
  start: number;
  end: number;
  conversation: number;
  cost: number;
  conversation_category?: string;
  conversation_type?: string;
}

export async function fetchMetaInsights(days: number): Promise<MetaInsights | null> {
  const token = process.env.META_WHATSAPP_TOKEN;
  const wabaId = process.env.META_WABA_ID;
  const phoneIdsRaw = process.env.META_WHATSAPP_PHONE_IDS || "";
  const phoneIds = phoneIdsRaw.split(",").map((s) => s.trim()).filter(Boolean);

  if (!token || !wabaId) return null;

  const now = Math.floor(Date.now() / 1000);
  const start = now - days * 86400;
  const headers = { Authorization: `Bearer ${token}` };

  async function fetchJson(path: string) {
    try {
      const res = await fetch(`https://graph.facebook.com/${META_API_VERSION}/${path}`, {
        headers,
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok) {
        return { error: (json?.error?.message as string) || `HTTP ${res.status}` };
      }
      return { data: json as Record<string, unknown> };
    } catch (err) {
      return { error: err instanceof Error ? err.message : "fetch failed" };
    }
  }

  const phoneStatus: PhoneStatus[] = await Promise.all(
    phoneIds.map(async (id) => {
      const r = await fetchJson(
        `${id}?fields=display_phone_number,verified_name,quality_rating,name_status,messaging_limit_tier,throughput`
      );
      if (r.error) return { id, error: r.error };
      const d = r.data as Record<string, unknown>;
      return {
        id,
        display_phone_number: d.display_phone_number as string | undefined,
        verified_name: d.verified_name as string | undefined,
        quality_rating: d.quality_rating as string | undefined,
        name_status: d.name_status as string | undefined,
        messaging_limit_tier: d.messaging_limit_tier as string | undefined,
        throughput: d.throughput as { level?: string } | undefined,
      };
    })
  );

  const templateRes = await fetchJson(
    `${wabaId}/template_analytics?start=${start}&end=${now}&granularity=DAILY&metric_types=["SENT","DELIVERED","READ","CLICKED"]`
  );
  const templatePoints: TemplateAnalyticsPoint[] =
    ((templateRes.data?.data as Array<{ data_points?: TemplateAnalyticsPoint[] }>)?.[0]
      ?.data_points as TemplateAnalyticsPoint[]) || [];

  const templatesListRes = await fetchJson(
    `${wabaId}/message_templates?fields=id,name,language,category&limit=100`
  );
  const templatesById: Record<string, { name: string; category: string }> = {};
  for (const t of (templatesListRes.data?.data as Array<{ id: string; name: string; category: string }>) || []) {
    templatesById[t.id] = { name: t.name, category: t.category };
  }

  const templateAggregated: Record<string, TemplateAgg> = {};
  for (const p of templatePoints) {
    const meta = templatesById[p.template_id] || { name: p.template_id, category: "?" };
    const agg = (templateAggregated[p.template_id] ??= {
      template_id: p.template_id,
      name: meta.name,
      category: meta.category,
      sent: 0,
      delivered: 0,
      read: 0,
      clicked: 0,
    });
    agg.sent += p.sent || 0;
    agg.delivered += p.delivered || 0;
    agg.read += p.read || 0;
    agg.clicked += (p.clicked || []).reduce((acc, c) => acc + (c.count || 0), 0);
  }

  const conversationRes = await fetchJson(
    `${wabaId}/conversation_analytics?start=${start}&end=${now}&granularity=DAILY&dimensions=["CONVERSATION_CATEGORY"]`
  );
  const conversationPoints: ConversationAnalyticsPoint[] =
    ((conversationRes.data?.conversation_analytics as { data?: Array<{ data_points?: ConversationAnalyticsPoint[] }> })
      ?.data?.[0]?.data_points as ConversationAnalyticsPoint[]) || [];

  const byCategory: Record<string, CategoryAgg> = {};
  let totalConversations = 0;
  let totalCost = 0;
  for (const p of conversationPoints) {
    const cat = p.conversation_category || "UNKNOWN";
    const agg = (byCategory[cat] ??= { category: cat, conversation: 0, cost: 0 });
    agg.conversation += p.conversation || 0;
    agg.cost += p.cost || 0;
    totalConversations += p.conversation || 0;
    totalCost += p.cost || 0;
  }

  const daily: Record<string, DailyConversationPoint> = {};
  for (const p of conversationPoints) {
    const date = new Date((p.start || 0) * 1000).toISOString().slice(0, 10);
    const d = (daily[date] ??= { date, conversations: 0, cost: 0 });
    d.conversations += p.conversation || 0;
    d.cost += p.cost || 0;
  }

  return {
    phone_status: phoneStatus,
    templates: Object.values(templateAggregated).sort((a, b) => b.sent - a.sent),
    conversations: {
      total: totalConversations,
      total_cost: totalCost,
      by_category: Object.values(byCategory).sort((a, b) => b.conversation - a.conversation),
      daily: Object.values(daily).sort((a, b) => a.date.localeCompare(b.date)),
    },
    errors: {
      template_analytics: templateRes.error,
      conversation_analytics: conversationRes.error,
      templates_list: templatesListRes.error,
    },
  };
}
