"use client";

import { Crown, ShieldCheck, Camera, MessageSquare, Users, Vote, Smartphone, TrendingUp } from "lucide-react";
import type { NumerosCampanha } from "./ImprensaLista";

// 5 cards Story 1080x1920 pra postar como carrossel de transparencia no @cdlaju.
// Renderizados off-screen e capturados via html-to-image (mesmo padrao do podium).
//
// Cada card e' marcado com data-transparencia-id={id} pra o ImprensaLista
// achar todos via querySelectorAll('[data-transparencia-id]').

function fmt(n: number): string {
  return n.toLocaleString("pt-BR");
}

function pct(parte: number, total: number): string {
  if (total === 0) return "0";
  return ((parte / total) * 100).toFixed(1).replace(/\.0$/, "");
}

const CONTAINER_STYLE = {
  width: 1080,
  height: 1920,
  paddingTop: 220,
  paddingBottom: 220,
  backgroundColor: "#0a2a5e",
  backgroundImage:
    "radial-gradient(circle at 50% 0%, rgba(255,215,0,0.18) 0%, transparent 55%), radial-gradient(circle at 50% 100%, rgba(0,168,89,0.12) 0%, transparent 50%)",
} as const;

function HeaderMarca() {
  return (
    <div
      className="text-center uppercase tracking-[0.3em] font-bold opacity-90 shrink-0"
      style={{ fontSize: 32 }}
    >
      Melhores do Ano · CDL Aracaju
    </div>
  );
}

function FooterMarca() {
  return (
    <div className="shrink-0">
      <p
        className="text-center font-semibold opacity-90"
        style={{ fontSize: 28 }}
      >
        Resultado oficial · 2026
      </p>
      <p
        className="text-center text-amber-300 font-bold mt-2"
        style={{ fontSize: 40 }}
      >
        @cdlaju · cdlaju.com.br
      </p>
    </div>
  );
}

// ------------------------------------ Capa ------------------------------------
function CardCapa() {
  return (
    <article
      className="flex flex-col px-14 relative text-white overflow-hidden"
      style={CONTAINER_STYLE}
    >
      <HeaderMarca />

      <div className="flex-1 flex flex-col items-center justify-center">
        <Crown className="w-32 h-32 fill-amber-300 text-amber-300" />
        <h1
          className="font-display font-bold mt-12 leading-[0.95] text-center"
          style={{ fontSize: 132 }}
        >
          Os números
          <br />
          da campanha
        </h1>
        <div
          className="mt-12 mx-auto px-8 py-3 rounded-full bg-amber-300 text-[#0a2a5e] uppercase tracking-[0.4em] font-bold"
          style={{ fontSize: 32 }}
        >
          transparência total
        </div>
        <p
          className="font-light text-center text-amber-300 italic mt-12 px-4"
          style={{ fontSize: 44, lineHeight: 1.3 }}
        >
          Cada voto auditado, cada CPF validado.
        </p>
      </div>

      <FooterMarca />
    </article>
  );
}

// ----------------------------------- Volumes ----------------------------------
function CardVolumes({ n }: { n: NumerosCampanha }) {
  const itens = [
    { icon: <Users className="w-12 h-12" />, label: "votantes únicos", value: fmt(n.votantes_unicos) },
    { icon: <Vote className="w-12 h-12" />, label: "votos válidos", value: fmt(n.votos_validos) },
    { icon: null, label: "subcategorias", value: fmt(n.subcategorias_ativas) },
    { icon: null, label: "candidatos elegíveis", value: fmt(n.candidatos_elegiveis) },
  ];

  return (
    <article
      className="flex flex-col px-14 relative text-white overflow-hidden"
      style={CONTAINER_STYLE}
    >
      <HeaderMarca />

      <div className="flex-1 flex flex-col items-center justify-center gap-8 mt-8">
        <h2
          className="font-display font-bold text-center leading-[1.0]"
          style={{ fontSize: 96 }}
        >
          Volumes
        </h2>

        <div className="flex flex-col gap-6 w-full mt-4">
          {itens.map((it, i) => (
            <div
              key={i}
              className="rounded-2xl bg-white/10 px-8 py-6 flex items-center gap-6"
            >
              {it.icon && (
                <div className="text-amber-300 shrink-0">{it.icon}</div>
              )}
              <div className="flex-1 min-w-0">
                <p
                  className="font-display-bold text-amber-300 leading-none"
                  style={{ fontSize: 88 }}
                >
                  {it.value}
                </p>
                <p
                  className="opacity-90 mt-1"
                  style={{ fontSize: 36 }}
                >
                  {it.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <FooterMarca />
    </article>
  );
}

// --------------------------------- Anti-fraude --------------------------------
function CardAntifraude({ n }: { n: NumerosCampanha }) {
  const selos = [
    {
      icon: <ShieldCheck className="w-16 h-16" />,
      pct: pct(n.com_spc_validado, n.votantes_unicos),
      label: "validados pelo",
      destaque: "SPC Brasil",
    },
    {
      icon: <Camera className="w-16 h-16" />,
      pct: pct(n.com_selfie, n.votantes_unicos),
      label: "com",
      destaque: "selfie obrigatória",
    },
    {
      icon: <MessageSquare className="w-16 h-16" />,
      pct: pct(n.com_whatsapp_validado, n.votantes_unicos),
      label: "confirmaram por",
      destaque: "WhatsApp",
    },
  ];

  return (
    <article
      className="flex flex-col px-14 relative text-white overflow-hidden"
      style={CONTAINER_STYLE}
    >
      <HeaderMarca />

      <div className="flex-1 flex flex-col items-center justify-center gap-8 mt-4">
        <div
          className="mx-auto px-8 py-3 rounded-full bg-amber-300 text-[#0a2a5e] uppercase tracking-[0.3em] font-bold"
          style={{ fontSize: 28 }}
        >
          anti-fraude
        </div>
        <h2
          className="font-display font-bold text-center leading-[1.0]"
          style={{ fontSize: 88 }}
        >
          Cada CPF<br />verificado
        </h2>

        <div className="flex flex-col gap-5 w-full mt-2">
          {selos.map((s, i) => (
            <div
              key={i}
              className="rounded-2xl bg-white/10 px-8 py-7 flex items-center gap-6"
            >
              <div className="text-amber-300 shrink-0">{s.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <p
                    className="font-display-bold text-amber-300 leading-none"
                    style={{ fontSize: 96 }}
                  >
                    {s.pct}%
                  </p>
                </div>
                <p style={{ fontSize: 32, marginTop: 4 }}>
                  {s.label}{" "}
                  <span className="font-bold text-amber-300">{s.destaque}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <FooterMarca />
    </article>
  );
}

// --------------------------------- Distribuição --------------------------------
function CardDistribuicao({ n }: { n: NumerosCampanha }) {
  return (
    <article
      className="flex flex-col px-14 relative text-white overflow-hidden"
      style={CONTAINER_STYLE}
    >
      <HeaderMarca />

      <div className="flex-1 flex flex-col items-center justify-center gap-10 mt-4">
        <h2
          className="font-display font-bold text-center leading-[1.0]"
          style={{ fontSize: 88 }}
        >
          Distribuição<br />técnica
        </h2>

        <div className="flex flex-col gap-6 w-full">
          <div className="rounded-2xl bg-white/10 px-8 py-7 flex items-center gap-6">
            <Smartphone className="w-16 h-16 text-amber-300 shrink-0" />
            <div className="flex-1">
              <p className="font-display-bold text-amber-300 leading-none" style={{ fontSize: 88 }}>
                {fmt(n.dispositivos_distintos)}
              </p>
              <p style={{ fontSize: 32, marginTop: 4 }}>
                dispositivos distintos
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-white/10 px-8 py-7 flex items-center gap-6">
            <div className="flex-1">
              <p className="font-display-bold text-amber-300 leading-none" style={{ fontSize: 88 }}>
                {fmt(n.ips_distintos)}
              </p>
              <p style={{ fontSize: 32, marginTop: 4 }}>IPs distintos</p>
            </div>
          </div>

          <div className="rounded-2xl bg-amber-300/20 ring-2 ring-amber-300 px-8 py-7">
            <p style={{ fontSize: 36, fontWeight: 600 }}>
              Limite legal:{" "}
              <span className="text-amber-300 font-bold">2 CPFs por dispositivo</span>
            </p>
            <p className="opacity-90 mt-2" style={{ fontSize: 28 }}>
              Sistema bloqueou em tempo real qualquer tentativa acima disso.
            </p>
          </div>
        </div>
      </div>

      <FooterMarca />
    </article>
  );
}

// ------------------------------------ Pico ------------------------------------
function CardPicoAgradecimento({ n }: { n: NumerosCampanha }) {
  return (
    <article
      className="flex flex-col px-14 relative text-white overflow-hidden"
      style={CONTAINER_STYLE}
    >
      <HeaderMarca />

      <div className="flex-1 flex flex-col items-center justify-center gap-12 mt-4">
        <div className="flex flex-col items-center">
          <TrendingUp className="w-24 h-24 text-amber-300" />
          <h2
            className="font-display font-bold text-center leading-[1.0] mt-6"
            style={{ fontSize: 80 }}
          >
            Pico de votação
          </h2>
          <p
            className="font-display-bold text-amber-300 leading-none mt-8"
            style={{ fontSize: 168 }}
          >
            {fmt(n.votos_dia_pico)}
          </p>
          <p className="opacity-90 mt-2" style={{ fontSize: 36 }}>
            votos {n.data_dia_pico ? `em ${n.data_dia_pico}` : "no dia de pico"}
          </p>
        </div>

        <div className="w-full h-[2px] bg-amber-300/40" />

        <div className="text-center">
          <p
            className="font-display font-bold leading-tight"
            style={{ fontSize: 72 }}
          >
            Obrigado
          </p>
          <p
            className="font-display italic text-amber-300 leading-tight mt-3"
            style={{ fontSize: 56 }}
          >
            a quem votou.
          </p>
          <p
            className="opacity-90 mt-8 px-4"
            style={{ fontSize: 32, lineHeight: 1.3 }}
          >
            Cada voto contado de forma transparente,<br />
            auditável e respeitando sua privacidade.
          </p>
        </div>
      </div>

      <FooterMarca />
    </article>
  );
}

// ------------------------------------------------------------------------------
// Container off-screen com os 5 cards. Cada um com data-transparencia-id pra
// captura programatica via querySelector.
export function TransparenciaCards({ n }: { n: NumerosCampanha }) {
  const cards = [
    { id: "capa", el: <CardCapa /> },
    { id: "volumes", el: <CardVolumes n={n} /> },
    { id: "antifraude", el: <CardAntifraude n={n} /> },
    { id: "distribuicao", el: <CardDistribuicao n={n} /> },
    { id: "pico", el: <CardPicoAgradecimento n={n} /> },
  ];

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: -99999,
        pointerEvents: "none",
      }}
      aria-hidden="true"
    >
      {cards.map((c) => (
        <div key={c.id} data-transparencia-id={c.id}>
          {c.el}
        </div>
      ))}
    </div>
  );
}

export const TRANSPARENCIA_IDS = [
  "capa",
  "volumes",
  "antifraude",
  "distribuicao",
  "pico",
] as const;
