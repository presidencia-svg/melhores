import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getCurrentTenant } from "@/lib/tenant/resolver";
import {
  CalendarRange,
  CheckCircle2,
  Clock,
  Hourglass,
  BarChart3,
  Trophy,
  Users,
  MessageSquare,
} from "lucide-react";
import { NovaEdicaoForm } from "./NovaEdicaoForm";

export const dynamic = "force-dynamic";

type EdicaoRow = {
  id: string;
  ano: number;
  nome: string;
  inicio_votacao: string;
  fim_votacao: string;
  ativa: boolean;
};

export default async function EdicoesPage() {
  const tenant = await getCurrentTenant();
  const supabase = createSupabaseAdminClient();
  const { data: edicoes } = await supabase
    .from("edicao")
    .select("id, ano, nome, inicio_votacao, fim_votacao, ativa")
    .eq("tenant_id", tenant.id)
    .order("ano", { ascending: false });

  const lista = (edicoes ?? []) as EdicaoRow[];
  const anos = lista.map((e) => e.ano);
  const proximoAno = anos.length > 0 ? Math.max(...anos) + 1 : new Date().getFullYear();

  return (
    <div className="p-8 max-w-4xl">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold text-cdl-blue">
          Edições da campanha
        </h1>
        <p className="text-muted mt-1">
          Cada ano tem sua edição. Criar uma nova desativa as anteriores
          automaticamente — votos antigos ficam preservados pra histórico.
        </p>
      </header>

      <NovaEdicaoForm
        tenantNome={tenant.nome}
        anoSugerido={proximoAno}
        anosUsados={anos}
      />

      <h2 className="font-display text-lg font-bold text-cdl-blue mt-10 mb-3">
        Histórico
      </h2>

      {lista.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted text-center py-8">
              Nenhuma edição criada ainda.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {lista.map((e) => (
            <EdicaoRowCard key={e.id} e={e} />
          ))}
        </div>
      )}

      <div className="mt-8 text-xs text-muted">
        Para editar nome ou datas de uma edição,{" "}
        <Link href="/admin" className="text-cdl-blue hover:underline">
          volte ao painel
        </Link>{" "}
        e use o card &ldquo;Encerramento da votação&rdquo;.
      </div>
    </div>
  );
}

function EdicaoRowCard({ e }: { e: EdicaoRow }) {
  const agora = Date.now();
  const inicio = new Date(e.inicio_votacao).getTime();
  const fim = new Date(e.fim_votacao).getTime();
  const status: "aberta" | "encerrada" | "nao_iniciada" =
    agora < inicio ? "nao_iniciada" : agora > fim ? "encerrada" : "aberta";

  const statusBadge = {
    aberta: {
      icon: <Clock className="w-3.5 h-3.5" />,
      label: "Em andamento",
      cls: "bg-cdl-green/15 text-cdl-green-dark",
    },
    encerrada: {
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      label: "Encerrada",
      cls: "bg-zinc-200 text-zinc-700",
    },
    nao_iniciada: {
      icon: <Hourglass className="w-3.5 h-3.5" />,
      label: "Aguardando início",
      cls: "bg-cdl-yellow/30 text-cdl-yellow-dark",
    },
  }[status];

  // Pra edicao ativa, os atalhos linkam pras paginas sem parametro
  // (compor.atual). Pra edicoes nao-ativas, passa ?edicao=<id> pra
  // forcar visualizacao do historico.
  const qs = e.ativa ? "" : `?edicao=${e.id}`;
  const atalhos: { href: string; label: string; icon: React.ReactNode }[] = [
    { href: `/admin${qs}`, label: "Dashboard", icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { href: `/admin/resultados${qs}`, label: "Resultados", icon: <Trophy className="w-3.5 h-3.5" /> },
    { href: `/admin/votantes${qs}`, label: "Votantes", icon: <Users className="w-3.5 h-3.5" /> },
    { href: `/admin/whatsapp/insights${qs}`, label: "WhatsApp", icon: <MessageSquare className="w-3.5 h-3.5" /> },
  ];

  return (
    <Card className={!e.ativa ? "opacity-90" : ""}>
      <CardContent>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-full bg-cdl-blue/10 text-cdl-blue flex items-center justify-center shrink-0">
              <CalendarRange className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-display-bold text-navy-800 text-lg leading-tight">
                  {e.nome}
                </h3>
                <span className="font-mono text-xs text-muted">{e.ano}</span>
                {e.ativa && (
                  <span className="text-[10px] uppercase tracking-wider bg-cdl-blue/10 text-cdl-blue px-1.5 py-0.5 rounded font-bold">
                    Ativa
                  </span>
                )}
              </div>
              <p className="text-xs text-muted mt-1">
                {new Date(e.inicio_votacao).toLocaleString("pt-BR", {
                  timeZone: "America/Sao_Paulo",
                  dateStyle: "short",
                  timeStyle: "short",
                })}{" "}
                →{" "}
                {new Date(e.fim_votacao).toLocaleString("pt-BR", {
                  timeZone: "America/Sao_Paulo",
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </p>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded ${statusBadge.cls}`}
          >
            {statusBadge.icon} {statusBadge.label}
          </span>
        </div>

        <div className="mt-3 pt-3 border-t border-[rgba(10,42,94,0.08)] flex flex-wrap gap-2">
          {atalhos.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border border-[rgba(10,42,94,0.15)] text-cdl-blue hover:bg-cdl-blue hover:text-white transition-colors"
            >
              {a.icon} {a.label}
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
