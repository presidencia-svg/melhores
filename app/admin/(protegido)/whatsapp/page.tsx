import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { Download, MessageSquare } from "lucide-react";

export default async function WhatsAppPage() {
  const supabase = createSupabaseAdminClient();
  const { count: validados } = await supabase
    .from("votantes")
    .select("*", { head: true, count: "exact" })
    .eq("whatsapp_validado", true);

  const { data: amostra } = await supabase
    .from("votantes")
    .select("nome, whatsapp")
    .eq("whatsapp_validado", true)
    .order("criado_em", { ascending: false })
    .limit(20);

  return (
    <div className="p-8">
      <header className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-cdl-blue">WhatsApps validados</h1>
          <p className="text-muted mt-1">{(validados ?? 0).toLocaleString("pt-BR")} pessoas opt-in confirmadas</p>
        </div>
        <a
          href="/api/admin/whatsapp/exportar"
          download
          className="inline-flex h-12 items-center gap-2 rounded-xl bg-cdl-blue text-white px-6 font-medium hover:bg-cdl-blue-dark transition-colors"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </a>
      </header>

      <Card>
        <CardContent>
          <div className="flex items-start gap-3 mb-4">
            <MessageSquare className="w-5 h-5 text-cdl-green mt-1" />
            <p className="text-sm text-muted">
              Lista das últimas 20 confirmações. Use o botão acima para exportar todos.
            </p>
          </div>

          <div className="border-t border-border divide-y divide-border">
            {(amostra ?? []).map((v, i) => (
              <div key={i} className="py-2 flex items-center gap-3">
                <span className="flex-1 text-sm font-medium">{v.nome}</span>
                <span className="text-sm text-muted font-mono">{v.whatsapp}</span>
              </div>
            ))}
            {(!amostra || amostra.length === 0) && (
              <p className="py-12 text-center text-muted text-sm">Nenhum WhatsApp validado ainda.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
