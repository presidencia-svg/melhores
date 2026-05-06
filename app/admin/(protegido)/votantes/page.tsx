import { Card, CardContent } from "@/components/ui/Card";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { maskCpf } from "@/lib/cpf";
import { Camera, MessageSquare, MapPin, Clock } from "lucide-react";
import { AtualizarBtn } from "../AtualizarBtn";
import { getCurrentTenant } from "@/lib/tenant/resolver";
import { getEdicaoStatus } from "@/lib/edicao-status";

// 1h: pos-eleicao a lista de votantes e' imutavel. Botao "Atualizar" no
// header invalida o cache na hora se precisar.
export const revalidate = 3600;

const PAGE_SIZE = 50;
const SIGNED_URL_TTL = 60 * 60; // 1h

type Props = {
  searchParams: Promise<{ page?: string }>;
};

export default async function VotantesPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const tenant = await getCurrentTenant();
  const status = await getEdicaoStatus(tenant.id);
  if (status.status === "sem_edicao") {
    return <div className="p-8 text-red-600">Crie uma edição ativa primeiro.</div>;
  }
  const edicao = status.edicao;
  const supabase = createSupabaseAdminClient();

  // RPC traz votantes paginados ja com count de votos no banco — sem
  // baixar votos/fingerprints inteiros (que truncavam em 1000).
  const [{ data: linhas }, { data: fpsCompart }] = await Promise.all([
    supabase.rpc("votantes_listagem", {
      p_edicao_id: edicao.id,
      p_offset: offset,
      p_limit: PAGE_SIZE,
    }),
    supabase
      .from("v_fingerprints_compartilhados")
      .select("device_fingerprint, total")
      .eq("edicao_id", edicao.id),
  ]);

  type LinhaVotante = {
    id: string;
    cpf: string;
    nome: string;
    selfie_url: string | null;
    ip: string | null;
    user_agent: string | null;
    device_fingerprint: string | null;
    whatsapp: string | null;
    whatsapp_validado: boolean;
    criado_em: string;
    votos_count: number;
    total_count: number;
  };
  const votantes = ((linhas ?? []) as LinhaVotante[]).map((r) => ({
    id: r.id,
    cpf: r.cpf,
    nome: r.nome,
    selfie_url: r.selfie_url,
    ip: r.ip,
    user_agent: r.user_agent,
    device_fingerprint: r.device_fingerprint,
    whatsapp: r.whatsapp,
    whatsapp_validado: r.whatsapp_validado,
    criado_em: r.criado_em,
  }));
  const count = Number(((linhas ?? [])[0] as LinhaVotante | undefined)?.total_count ?? 0);

  // Map fingerprint -> total (apenas os compartilhados aparecem na view)
  const fpCount = new Map<string, number>();
  for (const fp of fpsCompart ?? []) {
    if (fp.device_fingerprint) fpCount.set(fp.device_fingerprint, fp.total ?? 2);
  }

  // Map votante_id -> votos_count (vem direto do RPC)
  const votosMap = new Map<string, number>();
  for (const r of (linhas ?? []) as LinhaVotante[]) {
    votosMap.set(r.id, Number(r.votos_count ?? 0));
  }

  // Gera URLs assinadas pras selfies
  const selfieUrls = new Map<string, string>();
  for (const v of votantes ?? []) {
    if (v.selfie_url) {
      const { data } = await supabase.storage
        .from("selfies")
        .createSignedUrl(v.selfie_url, SIGNED_URL_TTL);
      if (data?.signedUrl) selfieUrls.set(v.id, data.signedUrl);
    }
  }

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  return (
    <div className="p-8">
      <header className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-bold text-cdl-blue">Votantes</h1>
          <p className="text-muted mt-1">
            {(count ?? 0).toLocaleString("pt-BR")} pessoas identificadas · página {page} de {totalPages || 1}
          </p>
        </div>
        <AtualizarBtn path="/admin/votantes" />
      </header>

      <div className="grid gap-3">
        {(votantes ?? []).map((v) => {
          const votos = votosMap.get(v.id) ?? 0;
          const dispositivo = parseUserAgent(v.user_agent ?? "");
          const selfieUrl = selfieUrls.get(v.id);
          const fpDuplicados = v.device_fingerprint ? (fpCount.get(v.device_fingerprint) ?? 1) : 1;

          return (
            <Card key={v.id} className={fpDuplicados >= 2 ? "ring-2 ring-orange-300/60" : ""}>
              <CardContent className="!p-4">
                <div className="flex items-start gap-4">
                  {selfieUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selfieUrl}
                      alt="Selfie"
                      className="w-20 h-20 rounded-xl object-cover ring-2 ring-cdl-blue/10 shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0">
                      <Camera className="w-6 h-6 text-zinc-400" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-display font-bold text-cdl-blue truncate">{v.nome}</h3>
                      {v.whatsapp_validado && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-cdl-green/10 text-cdl-green-dark font-semibold">
                          WhatsApp ✓
                        </span>
                      )}
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          votos > 0
                            ? "bg-cdl-yellow/20 text-cdl-yellow-dark"
                            : "bg-zinc-100 text-zinc-500"
                        }`}
                      >
                        🏆 {votos} {votos === 1 ? "voto" : "votos"}
                      </span>
                      {fpDuplicados >= 2 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-semibold" title="Mesmo dispositivo usado por outros votantes">
                          📱 {fpDuplicados} no mesmo aparelho
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted">
                      <div>
                        <span className="font-mono">{maskCpf(v.cpf)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(v.criado_em).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span className="font-mono">{v.ip ?? "—"}</span>
                      </div>
                      <div className="truncate">{dispositivo}</div>
                      {v.whatsapp && (
                        <div className="flex items-center gap-1 col-span-2">
                          <MessageSquare className="w-3 h-3" />
                          <span className="font-mono">{v.whatsapp}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {selfieUrl && (
                    <a
                      href={selfieUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-cdl-blue hover:underline shrink-0"
                    >
                      Ver foto →
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {(!votantes || votantes.length === 0) && (
          <p className="text-center text-muted py-12">Nenhum votante registrado ainda.</p>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {page > 1 && (
            <a
              href={`?page=${page - 1}`}
              className="px-4 py-2 rounded-lg border border-border hover:bg-cdl-blue/5 text-sm"
            >
              ← Anterior
            </a>
          )}
          <span className="text-sm text-muted px-3">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <a
              href={`?page=${page + 1}`}
              className="px-4 py-2 rounded-lg border border-border hover:bg-cdl-blue/5 text-sm"
            >
              Próxima →
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function parseUserAgent(ua: string): string {
  if (!ua) return "—";
  const isMobile = /Mobile|Android|iPhone|iPad/i.test(ua);
  let browser = "Outro";
  if (/Chrome/i.test(ua) && !/Edge|OPR/i.test(ua)) browser = "Chrome";
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = "Safari";
  else if (/Firefox/i.test(ua)) browser = "Firefox";
  else if (/Edge/i.test(ua)) browser = "Edge";

  let os = "—";
  if (/iPhone|iPad|iOS/i.test(ua)) os = "iOS";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/Windows/i.test(ua)) os = "Windows";
  else if (/Mac/i.test(ua)) os = "Mac";

  return `${isMobile ? "📱" : "💻"} ${browser} · ${os}`;
}
