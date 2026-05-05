"use client";

import { useMemo, useState } from "react";
import { toJpeg } from "html-to-image";
import { Card, CardContent } from "@/components/ui/Card";
import {
  Copy,
  Download,
  Check,
  Users,
  Vote,
  ShieldCheck,
  Camera,
  MessageSquare,
  Smartphone,
  TrendingUp,
  AlertOctagon,
  Instagram,
  Loader2,
} from "lucide-react";
import { TransparenciaCards, TRANSPARENCIA_IDS } from "./TransparenciaCards";

export type LinhaTop6 = {
  subcategoria_id: string;
  subcategoria_nome: string;
  categoria_id: string;
  categoria_nome: string;
  candidato_id: string;
  candidato_nome: string;
  total_votos: number;
  posicao: number;
};

export type NumerosCampanha = {
  votantes_unicos: number;
  votos_validos: number;
  subcategorias_ativas: number;
  candidatos_elegiveis: number;
  com_spc_validado: number;
  com_whatsapp_validado: number;
  com_selfie: number;
  ips_distintos: number;
  dispositivos_distintos: number;
  tentativas_identificacao: number;
  otps_nao_validados: number;
  dispositivos_compartilhados: number;
  votos_dia_pico: number;
  data_dia_pico: string | null;
};

type Modo = "categoria" | "alfabetica";

const MEDALHAS = ["🥇", "🥈", "🥉", "4º", "5º", "6º"];

function fmtVotos(n: number): string {
  return n.toLocaleString("pt-BR");
}

function pct(parte: number, total: number): string {
  if (total === 0) return "0";
  return ((parte / total) * 100).toFixed(1).replace(".0", "");
}

// Bloco de texto com os numeros da campanha pra colocar no comeco da
// release. Se numeros for null (view nao rodada), retorna string vazia.
function gerarBlocoNumeros(n: NumerosCampanha | null): string {
  if (!n) return "";
  const lines = [
    "NÚMEROS DA CAMPANHA · TRANSPARÊNCIA",
    "",
    `• Votantes únicos: ${fmtVotos(n.votantes_unicos)} pessoas identificadas por CPF`,
    `• Votos válidos: ${fmtVotos(n.votos_validos)}`,
    `• Subcategorias ativas: ${n.subcategorias_ativas}`,
    `• Candidatos elegíveis: ${fmtVotos(n.candidatos_elegiveis)}`,
    "",
    "Validações anti-fraude (todos os votantes passaram pelas etapas a seguir):",
    `• ${pct(n.com_spc_validado, n.votantes_unicos)}% com CPF validado pelo SPC Brasil (${fmtVotos(n.com_spc_validado)})`,
    `• ${pct(n.com_selfie, n.votantes_unicos)}% com selfie obrigatória (${fmtVotos(n.com_selfie)})`,
    `• ${pct(n.com_whatsapp_validado, n.votantes_unicos)}% com WhatsApp confirmado por OTP (${fmtVotos(n.com_whatsapp_validado)})`,
    "",
    "Distribuição técnica:",
    `• ${fmtVotos(n.ips_distintos)} IPs distintos`,
    `• ${fmtVotos(n.dispositivos_distintos)} dispositivos distintos (impressão digital de navegador)`,
    `• Limite de 2 CPFs por dispositivo: ${fmtVotos(n.dispositivos_compartilhados)} dispositivos no limite legal`,
    "",
    "Sinais anti-fraude registrados:",
    `• ${fmtVotos(n.tentativas_identificacao)} tentativas de identificação (rate-limit ativo: 5/IP a cada 5min)`,
    `• ${fmtVotos(n.otps_nao_validados)} códigos WhatsApp não confirmados (impedidos de votar)`,
    "",
    n.data_dia_pico
      ? `Pico de votação: ${fmtVotos(n.votos_dia_pico)} votos no dia ${n.data_dia_pico}`
      : "",
    "",
    "O sistema bloqueou em tempo real: CPFs inválidos via SPC, mais de 2 cadastros por aparelho, rajadas por IP, e bots via Cloudflare Turnstile.",
  ];
  return lines.filter((l) => l !== "").join("\n");
}

// Gera o texto da release nos dois formatos (categoria | A-Z).
function gerarTexto(
  linhas: LinhaTop6[],
  modo: Modo,
  numeros: NumerosCampanha | null
): string {
  const cabecalho = [
    "MELHORES DO ANO · CDL ARACAJU 2026",
    modo === "categoria"
      ? "Top 6 colocados por subcategoria"
      : "Top 6 colocados por subcategoria (ordem alfabética)",
  ].join("\n");

  const blocoNumeros = gerarBlocoNumeros(numeros);

  if (modo === "categoria") {
    const porCat = new Map<string, Map<string, LinhaTop6[]>>();
    for (const l of linhas) {
      if (!porCat.has(l.categoria_nome)) porCat.set(l.categoria_nome, new Map());
      const subs = porCat.get(l.categoria_nome)!;
      if (!subs.has(l.subcategoria_nome)) subs.set(l.subcategoria_nome, []);
      subs.get(l.subcategoria_nome)!.push(l);
    }
    const cats = Array.from(porCat.entries()).sort(([a], [b]) =>
      a.localeCompare(b, "pt-BR")
    );
    const blocos: string[] = [];
    for (const [cat, subs] of cats) {
      const subList = Array.from(subs.entries()).sort(([a], [b]) =>
        a.localeCompare(b, "pt-BR")
      );
      const sub_blocos: string[] = [];
      for (const [sub, cands] of subList) {
        const linhasCands = cands
          .sort((a, b) => a.posicao - b.posicao)
          .map(
            (c) =>
              `  ${MEDALHAS[c.posicao - 1] ?? `${c.posicao}º`} ${c.candidato_nome} (${fmtVotos(c.total_votos)})`
          );
        sub_blocos.push(`${sub}\n${linhasCands.join("\n")}`);
      }
      blocos.push(`${cat.toUpperCase()}\n\n${sub_blocos.join("\n\n")}`);
    }
    return [cabecalho, blocoNumeros, "", ...blocos].filter(Boolean).join("\n\n");
  }

  // modo alfabetico (subcategoria A-Z, sem categoria)
  const porSub = new Map<string, LinhaTop6[]>();
  for (const l of linhas) {
    if (!porSub.has(l.subcategoria_nome)) porSub.set(l.subcategoria_nome, []);
    porSub.get(l.subcategoria_nome)!.push(l);
  }
  const subs = Array.from(porSub.entries()).sort(([a], [b]) =>
    a.localeCompare(b, "pt-BR")
  );
  const blocos: string[] = [];
  for (const [sub, cands] of subs) {
    const linhasCands = cands
      .sort((a, b) => a.posicao - b.posicao)
      .map(
        (c) =>
          `  ${MEDALHAS[c.posicao - 1] ?? `${c.posicao}º`} ${c.candidato_nome} (${fmtVotos(c.total_votos)})`
      );
    blocos.push(`${sub.toUpperCase()}\n${linhasCands.join("\n")}`);
  }
  return [cabecalho, blocoNumeros, "", ...blocos].filter(Boolean).join("\n\n");
}

export function ImprensaLista({
  linhas,
  numeros,
}: {
  linhas: LinhaTop6[];
  numeros: NumerosCampanha | null;
}) {
  const [modo, setModo] = useState<Modo>("categoria");
  const [copiado, setCopiado] = useState(false);

  const texto = useMemo(
    () => gerarTexto(linhas, modo, numeros),
    [linhas, modo, numeros]
  );

  const [igEstado, setIgEstado] = useState<{
    feito: number;
    total: number;
    permalink: string | null;
    erro: string | null;
  } | null>(null);

  async function postarTransparencia() {
    if (!numeros) {
      alert("Sem números pra postar — rode a migration 030 antes.");
      return;
    }
    if (igEstado && igEstado.erro === null && igEstado.feito < igEstado.total) return;

    setIgEstado({ feito: 0, total: TRANSPARENCIA_IDS.length, permalink: null, erro: null });

    const imagens: string[] = [];
    for (const id of TRANSPARENCIA_IDS) {
      const node = document.querySelector<HTMLElement>(
        `[data-transparencia-id="${id}"]`
      );
      if (!node) {
        setIgEstado({
          feito: imagens.length,
          total: TRANSPARENCIA_IDS.length,
          permalink: null,
          erro: `Card ${id} não encontrado no DOM`,
        });
        return;
      }
      try {
        const dataUrl = await toJpeg(node, {
          cacheBust: true,
          pixelRatio: 1.5,
          quality: 0.85,
          backgroundColor: "#0a2a5e",
        });
        imagens.push(dataUrl);
        setIgEstado({
          feito: imagens.length,
          total: TRANSPARENCIA_IDS.length,
          permalink: null,
          erro: null,
        });
      } catch (e) {
        setIgEstado({
          feito: imagens.length,
          total: TRANSPARENCIA_IDS.length,
          permalink: null,
          erro: `Erro ao gerar ${id}: ${e instanceof Error ? e.message : "?"}`,
        });
        return;
      }
    }

    const caption = [
      "🏆 MELHORES DO ANO · CDL ARACAJU 2026",
      "Os números da campanha · Transparência total",
      "",
      "Cada CPF validado pelo SPC Brasil. Cada votante com selfie obrigatória. Cada voto auditável.",
      "",
      `📊 ${numeros.votantes_unicos.toLocaleString("pt-BR")} votantes únicos`,
      `🗳️ ${numeros.votos_validos.toLocaleString("pt-BR")} votos válidos em ${numeros.subcategorias_ativas} subcategorias`,
      `🛡️ ${pct(numeros.com_spc_validado, numeros.votantes_unicos)}% verificados pelo SPC`,
      "",
      "Obrigado a cada votante que fez parte dessa edição. 💙",
      "",
      "#MelhoresDoAnoCDL #CDLAracaju #Aracaju #Sergipe #Transparência",
    ].join("\n");

    try {
      const res = await fetch("/api/admin/instagram/postar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imagens, caption }),
      });
      const text = await res.text();
      let json: { error?: string; detail?: string; permalink?: string | null };
      try {
        json = JSON.parse(text);
      } catch {
        json = {
          error: res.status === 413 ? "Payload muito grande" : `HTTP ${res.status}`,
          detail: text.slice(0, 200),
        };
      }
      if (!res.ok) {
        setIgEstado({
          feito: TRANSPARENCIA_IDS.length,
          total: TRANSPARENCIA_IDS.length,
          permalink: null,
          erro: `${json.error}${json.detail ? ` — ${json.detail}` : ""}`,
        });
        return;
      }
      setIgEstado({
        feito: TRANSPARENCIA_IDS.length,
        total: TRANSPARENCIA_IDS.length,
        permalink: json.permalink ?? null,
        erro: null,
      });
    } catch (e) {
      setIgEstado({
        feito: TRANSPARENCIA_IDS.length,
        total: TRANSPARENCIA_IDS.length,
        permalink: null,
        erro: e instanceof Error ? e.message : "Falha de rede",
      });
    }
  }

  const igPostando =
    igEstado !== null && igEstado.erro === null && igEstado.feito < igEstado.total;
  const igOk =
    igEstado !== null && igEstado.erro === null && igEstado.feito === igEstado.total;

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      alert("Não consegui copiar — selecione o texto e copie manualmente.");
    }
  }

  function baixar() {
    const blob = new Blob([texto], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const sufixo = modo === "categoria" ? "por-categoria" : "alfabetica";
    link.download = `melhores-do-ano-2026-top6-${sufixo}.txt`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }

  // Conta total de subs e candidatos pra mostrar no header
  const subsUnicas = new Set(linhas.map((l) => l.subcategoria_nome)).size;

  return (
    <>
      {numeros && <NumerosCampanhaCards n={numeros} />}
      {numeros && <TransparenciaCards n={numeros} />}

      {numeros && (
        <div className="rounded-xl border border-fuchsia-300/60 bg-gradient-to-r from-fuchsia-50 to-amber-50 p-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-fuchsia-600 to-amber-500 text-white flex items-center justify-center shrink-0">
                <Instagram className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="font-display text-base font-bold text-cdl-blue">
                  Postar números da campanha no @cdlaju
                </p>
                <p className="text-xs text-muted leading-snug">
                  Carrossel Story de 5 slides (1080×1920): capa, volumes,
                  anti-fraude, distribuição técnica, pico + agradecimento.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={postarTransparencia}
              disabled={igPostando}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-gradient-to-r from-fuchsia-600 to-amber-500 text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {igPostando ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Instagram className="w-4 h-4" />
              )}
              {igPostando ? "postando…" : "postar transparência"}
            </button>
          </div>

          {igEstado && (
            <div className="mt-3 text-xs">
              {igEstado.erro ? (
                <p className="text-rose-700">
                  ✗ {igEstado.erro}
                </p>
              ) : igOk ? (
                <p className="text-emerald-700">
                  ✓ Publicado!{" "}
                  {igEstado.permalink && (
                    <a
                      href={igEstado.permalink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-semibold"
                    >
                      Abrir no Instagram
                    </a>
                  )}
                </p>
              ) : (
                <p className="text-cdl-blue">
                  Capturando slides… {igEstado.feito}/{igEstado.total}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <nav className="flex gap-1 bg-cream-100 border border-[rgba(10,42,94,0.15)] rounded-lg p-1">
          <button
            type="button"
            onClick={() => setModo("categoria")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              modo === "categoria"
                ? "bg-cdl-blue text-white"
                : "text-cdl-blue hover:bg-cdl-blue/10"
            }`}
          >
            Por categoria
          </button>
          <button
            type="button"
            onClick={() => setModo("alfabetica")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              modo === "alfabetica"
                ? "bg-cdl-blue text-white"
                : "text-cdl-blue hover:bg-cdl-blue/10"
            }`}
          >
            A–Z
          </button>
        </nav>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">
            {subsUnicas} subcategorias · {linhas.length} linhas
          </span>
          <button
            type="button"
            onClick={copiar}
            className={`inline-flex items-center gap-2 h-9 px-3 rounded-lg text-sm font-medium transition-colors ${
              copiado
                ? "bg-emerald-600 text-white"
                : "bg-cdl-blue text-white hover:bg-cdl-blue-dark"
            }`}
          >
            {copiado ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copiado ? "Copiado!" : "Copiar tudo"}
          </button>
          <button
            type="button"
            onClick={baixar}
            className="inline-flex items-center gap-2 h-9 px-3 rounded-lg bg-cdl-green text-white text-sm font-medium hover:bg-cdl-green-dark transition-colors"
          >
            <Download className="w-4 h-4" />
            Baixar .txt
          </button>
        </div>
      </div>

      <Card>
        <CardContent>
          <pre className="font-mono text-[13px] leading-relaxed whitespace-pre-wrap text-foreground">
            {texto}
          </pre>
        </CardContent>
      </Card>
    </>
  );
}

// Cards visuais com os principais numeros da campanha. So aparece se a
// view v_numeros_campanha estiver criada (migration 030).
function NumerosCampanhaCards({ n }: { n: NumerosCampanha }) {
  const cards: {
    icon: React.ReactNode;
    label: string;
    value: string;
    sub?: string;
    accent: string;
  }[] = [
    {
      icon: <Users className="w-5 h-5" />,
      label: "Votantes únicos",
      value: fmtVotos(n.votantes_unicos),
      sub: "CPFs identificados",
      accent: "bg-cdl-blue/10 text-cdl-blue",
    },
    {
      icon: <Vote className="w-5 h-5" />,
      label: "Votos válidos",
      value: fmtVotos(n.votos_validos),
      sub: `em ${n.subcategorias_ativas} subcategorias`,
      accent: "bg-cdl-green/10 text-cdl-green-dark",
    },
    {
      icon: <ShieldCheck className="w-5 h-5" />,
      label: "Validados pelo SPC",
      value: `${pct(n.com_spc_validado, n.votantes_unicos)}%`,
      sub: `${fmtVotos(n.com_spc_validado)} CPFs`,
      accent: "bg-emerald-100 text-emerald-700",
    },
    {
      icon: <Camera className="w-5 h-5" />,
      label: "Com selfie obrigatória",
      value: `${pct(n.com_selfie, n.votantes_unicos)}%`,
      sub: `${fmtVotos(n.com_selfie)} fotos`,
      accent: "bg-amber-100 text-amber-700",
    },
    {
      icon: <MessageSquare className="w-5 h-5" />,
      label: "WhatsApp confirmado",
      value: `${pct(n.com_whatsapp_validado, n.votantes_unicos)}%`,
      sub: `${fmtVotos(n.com_whatsapp_validado)} OTPs validados`,
      accent: "bg-emerald-100 text-emerald-700",
    },
    {
      icon: <Smartphone className="w-5 h-5" />,
      label: "Dispositivos distintos",
      value: fmtVotos(n.dispositivos_distintos),
      sub: `${fmtVotos(n.ips_distintos)} IPs`,
      accent: "bg-cdl-blue/10 text-cdl-blue",
    },
    {
      icon: <AlertOctagon className="w-5 h-5" />,
      label: "Tentativas bloqueadas",
      value: fmtVotos(n.tentativas_identificacao + n.otps_nao_validados),
      sub: `${fmtVotos(n.tentativas_identificacao)} rate-limit + ${fmtVotos(n.otps_nao_validados)} OTPs`,
      accent: "bg-rose-100 text-rose-700",
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      label: "Pico no dia",
      value: fmtVotos(n.votos_dia_pico),
      sub: n.data_dia_pico ? `em ${n.data_dia_pico}` : undefined,
      accent: "bg-cdl-yellow/15 text-cdl-yellow-dark",
    },
  ];

  return (
    <div>
      <h2 className="font-display-bold text-cdl-green text-sm uppercase tracking-wider mb-3">
        Números da campanha
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="!p-4">
              <div className="flex items-start justify-between mb-2">
                <p className="text-[10px] font-semibold text-muted uppercase tracking-wider leading-tight">
                  {c.label}
                </p>
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${c.accent}`}
                >
                  {c.icon}
                </div>
              </div>
              <p className="font-display text-2xl font-bold text-foreground tabular-nums">
                {c.value}
              </p>
              {c.sub && <p className="text-[11px] text-muted mt-0.5">{c.sub}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
