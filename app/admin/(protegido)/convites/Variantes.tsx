"use client";

import type { TenantBranding } from "@/lib/tenant/branding";

// 4 variantes de convite A4 retrato (210x297mm) pra Festa de Premiacao
// dos Melhores do Ano. Cada variante tem identidade visual propria mas
// compartilha as mesmas props/dados.

export type Variante = "classico" | "navy" | "editorial" | "vinho";

export type ConviteProps = {
  branding: TenantBranding;
  nomeVencedor: string;
  categoria: string;
  grupo: string;

  // Dados do evento (editaveis)
  dataFesta: string;
  diaSemana: string;
  horario: string;
  local: string;
  enderecoLocal: string;
  valorMesa: string;
  pessoasPorMesa: string;
  dataLimite: string;
  telefoneContato: string;
  signatario: string;
  cargoSignatario: string;

  // Textos editaveis
  textoSupra: string;     // "tem a honra de convidar"
  textoSubcat: string;    // "eleito(a) o(a) Melhor do Ano em"
  textoFormal: string;    // paragrafo principal
  textoInclusos: string;  // linha de inclusos
  textoValorObs: string;  // obs abaixo do valor
};

export const VARIANTES: Record<
  Variante,
  { nome: string; Componente: React.ComponentType<ConviteProps> }
> = {
  classico: { nome: "A · Clássico Dourado", Componente: ConviteClassico },
  navy: { nome: "B · Navy Premium", Componente: ConviteNavy },
  editorial: { nome: "C · Editorial Moderno", Componente: ConviteEditorial },
  vinho: { nome: "D · Vinho Gala", Componente: ConviteVinho },
};

// ============================================================================
// VARIANTE A — Clássico Dourado (cream + gold, italic, formal)
// ============================================================================

function ConviteClassico(p: ConviteProps) {
  const NAVY = "#0c2a5b";
  const GOLD = "#b8924a";
  const GOLD_DARK = "#8a6a30";
  const CREAM = "#fdfbf5";
  const MUTED = "#6b6b6b";

  return (
    <div
      style={{
        width: "210mm",
        height: "297mm",
        backgroundColor: CREAM,
        position: "relative",
        fontFamily: "'Fraunces', Georgia, serif",
        color: NAVY,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: "12mm",
          border: `1.5px solid ${GOLD}`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: "14mm",
          border: `0.5px solid ${GOLD}`,
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          padding: "24mm 22mm",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          height: "100%",
        }}
      >
        <Logo branding={p.branding} maxHeight="20mm" />

        <Kicker text={p.textoSupra} color={GOLD_DARK} mt="6mm" />

        <div
          style={{
            fontSize: "26pt",
            fontWeight: 800,
            fontStyle: "italic",
            lineHeight: 1.1,
            margin: "2mm 0 4mm 0",
            maxWidth: "150mm",
          }}
        >
          {p.nomeVencedor}
        </div>

        <div
          style={{
            fontSize: "10pt",
            color: MUTED,
            marginBottom: "2mm",
            fontFamily: "'Sora', sans-serif",
          }}
        >
          {p.textoSubcat}
        </div>
        <div
          style={{ fontSize: "16pt", fontWeight: 600, color: GOLD_DARK }}
        >
          {p.categoria}
        </div>
        <div
          style={{
            fontSize: "9pt",
            color: MUTED,
            fontFamily: "'Sora', sans-serif",
            fontStyle: "italic",
            marginBottom: "10mm",
          }}
        >
          {p.grupo}
        </div>

        <Divider color={GOLD} />

        <div
          style={{
            fontSize: "11pt",
            lineHeight: 1.7,
            maxWidth: "150mm",
            margin: "10mm 0",
            fontFamily: "'Sora', sans-serif",
          }}
        >
          {p.textoFormal}
        </div>

        <div
          style={{
            border: `1px solid ${GOLD}`,
            backgroundColor: "rgba(184, 146, 74, 0.04)",
            padding: "8mm 12mm",
            minWidth: "120mm",
            display: "flex",
            flexDirection: "column",
            gap: "3mm",
            alignItems: "center",
          }}
        >
          <KickerSmall text="Detalhes do evento" color={GOLD_DARK} />
          <div style={{ fontSize: "14pt", fontWeight: 700 }}>
            {p.dataFesta}
          </div>
          <div
            style={{
              fontSize: "10pt",
              color: MUTED,
              fontFamily: "'Sora', sans-serif",
              fontStyle: "italic",
            }}
          >
            {p.diaSemana} · às {p.horario}
          </div>
          <div style={{ fontSize: "11pt", fontWeight: 600 }}>{p.local}</div>
          <div
            style={{
              fontSize: "9pt",
              color: MUTED,
              fontFamily: "'Sora', sans-serif",
            }}
          >
            {p.enderecoLocal}
          </div>
        </div>

        <div
          style={{
            fontSize: "10pt",
            marginTop: "8mm",
            fontFamily: "'Sora', sans-serif",
          }}
        >
          {p.textoInclusos}
        </div>

        <div
          style={{
            fontSize: "11pt",
            marginTop: "6mm",
            fontFamily: "'Sora', sans-serif",
          }}
        >
          <strong style={{ color: GOLD_DARK }}>{p.valorMesa}</strong>
          {" · mesa para "}
          <strong>{p.pessoasPorMesa}</strong>
          <br />
          <span style={{ fontSize: "9pt", color: MUTED }}>
            {p.textoValorObs}
          </span>
        </div>

        <FooterAssinatura {...p} corLinha={GOLD} corTexto={NAVY} mutedColor={MUTED} />
      </div>
    </div>
  );
}

// ============================================================================
// VARIANTE B — Navy Premium (dark navy bg, gold + white)
// ============================================================================

function ConviteNavy(p: ConviteProps) {
  const NAVY = "#08213f";
  const NAVY_DEEP = "#051634";
  const GOLD = "#d4a85c";
  const GOLD_BRIGHT = "#e8bf6f";
  const TEXT = "#f5e9d4";
  const MUTED = "rgba(245, 233, 212, 0.6)";

  return (
    <div
      style={{
        width: "210mm",
        height: "297mm",
        background: `linear-gradient(180deg, ${NAVY} 0%, ${NAVY_DEEP} 100%)`,
        position: "relative",
        fontFamily: "'Fraunces', Georgia, serif",
        color: TEXT,
        overflow: "hidden",
      }}
    >
      {/* Cantos decorativos dourados */}
      {(["tl", "tr", "bl", "br"] as const).map((pos) => (
        <CornerArt key={pos} position={pos} color={GOLD} />
      ))}

      <div
        style={{
          position: "relative",
          zIndex: 1,
          padding: "30mm 24mm",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          height: "100%",
        }}
      >
        <Logo branding={p.branding} maxHeight="18mm" tint="white" />

        <div
          style={{
            fontSize: "8pt",
            letterSpacing: "0.5em",
            color: GOLD_BRIGHT,
            textTransform: "uppercase",
            marginTop: "8mm",
            marginBottom: "6mm",
            fontFamily: "'Sora', sans-serif",
            fontWeight: 600,
          }}
        >
          {p.textoSupra}
        </div>

        <div
          style={{
            fontSize: "30pt",
            fontWeight: 700,
            color: GOLD_BRIGHT,
            lineHeight: 1.05,
            margin: "2mm 0 6mm 0",
            maxWidth: "150mm",
            letterSpacing: "-0.01em",
          }}
        >
          {p.nomeVencedor}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4mm",
            marginBottom: "4mm",
          }}
        >
          <div style={{ width: "30mm", height: "0.5px", backgroundColor: GOLD }} />
          <div
            style={{
              fontSize: "9pt",
              color: MUTED,
              fontFamily: "'Sora', sans-serif",
              fontStyle: "italic",
            }}
          >
            {p.textoSubcat}
          </div>
          <div style={{ width: "30mm", height: "0.5px", backgroundColor: GOLD }} />
        </div>

        <div
          style={{
            fontSize: "18pt",
            fontWeight: 600,
            color: TEXT,
            marginBottom: "1mm",
          }}
        >
          {p.categoria}
        </div>
        <div
          style={{
            fontSize: "9pt",
            color: MUTED,
            fontFamily: "'Sora', sans-serif",
            marginBottom: "12mm",
          }}
        >
          {p.grupo}
        </div>

        <div
          style={{
            fontSize: "10pt",
            lineHeight: 1.7,
            maxWidth: "150mm",
            color: TEXT,
            fontFamily: "'Sora', sans-serif",
            marginBottom: "10mm",
          }}
        >
          {p.textoFormal}
        </div>

        {/* Bloco evento — fundo gold sutil */}
        <div
          style={{
            border: `1px solid ${GOLD}`,
            padding: "8mm 12mm",
            minWidth: "130mm",
            display: "flex",
            flexDirection: "column",
            gap: "3mm",
            alignItems: "center",
            backgroundColor: "rgba(212, 168, 92, 0.05)",
          }}
        >
          <KickerSmall text="Reserve a data" color={GOLD_BRIGHT} />
          <div
            style={{
              fontSize: "16pt",
              fontWeight: 700,
              color: GOLD_BRIGHT,
            }}
          >
            {p.dataFesta}
          </div>
          <div
            style={{
              fontSize: "10pt",
              color: TEXT,
              fontFamily: "'Sora', sans-serif",
            }}
          >
            {p.diaSemana} · às {p.horario}
          </div>
          <div style={{ fontSize: "11pt", fontWeight: 600 }}>{p.local}</div>
          <div
            style={{
              fontSize: "9pt",
              color: MUTED,
              fontFamily: "'Sora', sans-serif",
            }}
          >
            {p.enderecoLocal}
          </div>
        </div>

        <div
          style={{
            fontSize: "10pt",
            marginTop: "8mm",
            fontFamily: "'Sora', sans-serif",
            color: TEXT,
          }}
        >
          {p.textoInclusos}
        </div>

        <div
          style={{
            fontSize: "11pt",
            marginTop: "6mm",
            fontFamily: "'Sora', sans-serif",
          }}
        >
          <strong style={{ color: GOLD_BRIGHT }}>{p.valorMesa}</strong>
          {" · mesa para "}
          <strong>{p.pessoasPorMesa}</strong>
          <br />
          <span style={{ fontSize: "9pt", color: MUTED }}>
            {p.textoValorObs}
          </span>
        </div>

        <FooterAssinatura
          {...p}
          corLinha={GOLD}
          corTexto={TEXT}
          mutedColor={MUTED}
        />
      </div>
    </div>
  );
}

// ============================================================================
// VARIANTE C — Editorial Moderno (clean, asymmetric, minimal)
// ============================================================================

function ConviteEditorial(p: ConviteProps) {
  const NAVY = "#0c2a5b";
  const ACCENT = "#1ea049";
  const MUTED = "#6b6b6b";
  const BG = "#ffffff";
  const RULE = "#dcdcdc";

  return (
    <div
      style={{
        width: "210mm",
        height: "297mm",
        backgroundColor: BG,
        position: "relative",
        fontFamily: "'Sora', system-ui, sans-serif",
        color: NAVY,
        overflow: "hidden",
      }}
    >
      {/* Barra vertical accent à esquerda */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "8mm",
          height: "100%",
          backgroundColor: NAVY,
        }}
      />

      <div
        style={{
          padding: "20mm 18mm 20mm 22mm",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          gap: "0",
        }}
      >
        {/* Topo: logo + ano */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingBottom: "8mm",
            borderBottom: `0.5px solid ${RULE}`,
          }}
        >
          <Logo branding={p.branding} maxHeight="14mm" />
          <div
            style={{
              fontSize: "10pt",
              color: MUTED,
              letterSpacing: "0.2em",
            }}
          >
            {p.branding.ano} · MELHORES DO ANO
          </div>
        </div>

        {/* Kicker */}
        <div
          style={{
            fontSize: "9pt",
            color: ACCENT,
            textTransform: "uppercase",
            letterSpacing: "0.3em",
            fontWeight: 600,
            marginTop: "20mm",
          }}
        >
          {p.textoSupra}
        </div>

        {/* Nome — gigante, ousado */}
        <div
          style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontSize: "44pt",
            fontWeight: 800,
            color: NAVY,
            lineHeight: 1,
            marginTop: "4mm",
            marginBottom: "8mm",
            letterSpacing: "-0.02em",
          }}
        >
          {p.nomeVencedor}
        </div>

        {/* Categoria + grupo */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: "6mm",
            paddingBottom: "10mm",
            borderBottom: `0.5px solid ${RULE}`,
          }}
        >
          <div style={{ fontSize: "10pt", color: MUTED, minWidth: "60mm" }}>
            {p.textoSubcat}
          </div>
          <div style={{ fontSize: "13pt", fontWeight: 700, color: NAVY }}>
            {p.categoria}
          </div>
          <div
            style={{
              fontSize: "9pt",
              color: MUTED,
              fontStyle: "italic",
              marginLeft: "auto",
            }}
          >
            {p.grupo}
          </div>
        </div>

        {/* Texto formal */}
        <div
          style={{
            fontSize: "10pt",
            lineHeight: 1.7,
            color: NAVY,
            marginTop: "10mm",
            maxWidth: "155mm",
          }}
        >
          {p.textoFormal}
        </div>

        {/* Detalhes em grid */}
        <div
          style={{
            marginTop: "12mm",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "8mm 12mm",
            paddingTop: "8mm",
            borderTop: `2px solid ${NAVY}`,
          }}
        >
          <Field label="Quando" value={`${p.dataFesta} · ${p.horario}`} sub={p.diaSemana} navy={NAVY} muted={MUTED} />
          <Field label="Onde" value={p.local} sub={p.enderecoLocal} navy={NAVY} muted={MUTED} />
          <Field label="Investimento" value={p.valorMesa} sub={`Mesa para ${p.pessoasPorMesa} · ${p.textoValorObs}`} navy={NAVY} muted={MUTED} />
          <Field label="RSVP" value={p.telefoneContato} sub={`Confirmar até ${p.dataLimite}`} navy={NAVY} muted={MUTED} />
        </div>

        {/* Inclusos */}
        <div
          style={{
            fontSize: "10pt",
            color: NAVY,
            marginTop: "12mm",
            paddingTop: "6mm",
            borderTop: `0.5px solid ${RULE}`,
          }}
        >
          {p.textoInclusos}
        </div>

        {/* Assinatura */}
        <div style={{ marginTop: "auto", paddingTop: "10mm" }}>
          <div style={{ width: "60mm", height: "0.5px", backgroundColor: NAVY }} />
          <div style={{ fontSize: "10pt", fontWeight: 700, color: NAVY, marginTop: "2mm" }}>
            {p.signatario}
          </div>
          <div style={{ fontSize: "8pt", color: MUTED, fontStyle: "italic" }}>
            {p.cargoSignatario}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// VARIANTE D — Vinho Gala (warm wine + gold, dramatic)
// ============================================================================

function ConviteVinho(p: ConviteProps) {
  const WINE = "#5a1a2e";
  const WINE_DEEP = "#3d1020";
  const GOLD = "#d4a85c";
  const GOLD_BRIGHT = "#f0d490";
  const CREAM = "#f5e9d4";
  const MUTED = "rgba(245, 233, 212, 0.65)";

  return (
    <div
      style={{
        width: "210mm",
        height: "297mm",
        background: `radial-gradient(circle at 50% 0%, ${WINE} 0%, ${WINE_DEEP} 100%)`,
        position: "relative",
        fontFamily: "'Fraunces', Georgia, serif",
        color: CREAM,
        overflow: "hidden",
      }}
    >
      {/* Borda dupla dourada */}
      <div
        style={{
          position: "absolute",
          inset: "10mm",
          border: `2px solid ${GOLD}`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: "13mm",
          border: `0.5px solid ${GOLD}`,
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          padding: "26mm 22mm",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          height: "100%",
        }}
      >
        <Logo branding={p.branding} maxHeight="18mm" tint="white" />

        {/* Ornamento decorativo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4mm",
            marginTop: "6mm",
            marginBottom: "6mm",
          }}
        >
          <div style={{ width: "16mm", height: "0.5px", backgroundColor: GOLD }} />
          <span style={{ fontSize: "16pt", color: GOLD_BRIGHT }}>✦</span>
          <div style={{ width: "16mm", height: "0.5px", backgroundColor: GOLD }} />
        </div>

        <div
          style={{
            fontSize: "9pt",
            letterSpacing: "0.4em",
            color: GOLD_BRIGHT,
            textTransform: "uppercase",
            fontFamily: "'Sora', sans-serif",
            fontWeight: 600,
            marginBottom: "4mm",
          }}
        >
          {p.textoSupra}
        </div>

        <div
          style={{
            fontSize: "28pt",
            fontWeight: 800,
            fontStyle: "italic",
            color: GOLD_BRIGHT,
            lineHeight: 1.05,
            margin: "2mm 0 6mm 0",
            maxWidth: "150mm",
          }}
        >
          {p.nomeVencedor}
        </div>

        <div
          style={{
            fontSize: "10pt",
            color: MUTED,
            marginBottom: "2mm",
            fontFamily: "'Sora', sans-serif",
            fontStyle: "italic",
          }}
        >
          {p.textoSubcat}
        </div>
        <div
          style={{
            fontSize: "16pt",
            fontWeight: 600,
            color: CREAM,
          }}
        >
          {p.categoria}
        </div>
        <div
          style={{
            fontSize: "9pt",
            color: MUTED,
            fontFamily: "'Sora', sans-serif",
            marginBottom: "10mm",
          }}
        >
          {p.grupo}
        </div>

        <div
          style={{
            fontSize: "10pt",
            lineHeight: 1.7,
            maxWidth: "150mm",
            fontFamily: "'Sora', sans-serif",
            color: CREAM,
            marginBottom: "8mm",
          }}
        >
          {p.textoFormal}
        </div>

        <div
          style={{
            border: `1px solid ${GOLD}`,
            backgroundColor: "rgba(212, 168, 92, 0.08)",
            padding: "8mm 12mm",
            minWidth: "120mm",
            display: "flex",
            flexDirection: "column",
            gap: "3mm",
            alignItems: "center",
          }}
        >
          <KickerSmall text="Noite de gala" color={GOLD_BRIGHT} />
          <div
            style={{ fontSize: "16pt", fontWeight: 700, color: GOLD_BRIGHT }}
          >
            {p.dataFesta}
          </div>
          <div
            style={{
              fontSize: "10pt",
              fontFamily: "'Sora', sans-serif",
            }}
          >
            {p.diaSemana} · às {p.horario}
          </div>
          <div style={{ fontSize: "11pt", fontWeight: 600 }}>{p.local}</div>
          <div
            style={{
              fontSize: "9pt",
              color: MUTED,
              fontFamily: "'Sora', sans-serif",
            }}
          >
            {p.enderecoLocal}
          </div>
        </div>

        <div
          style={{
            fontSize: "10pt",
            marginTop: "8mm",
            fontFamily: "'Sora', sans-serif",
            color: CREAM,
          }}
        >
          {p.textoInclusos}
        </div>

        <div
          style={{
            fontSize: "11pt",
            marginTop: "6mm",
            fontFamily: "'Sora', sans-serif",
          }}
        >
          <strong style={{ color: GOLD_BRIGHT }}>{p.valorMesa}</strong>
          {" · mesa para "}
          <strong>{p.pessoasPorMesa}</strong>
          <br />
          <span style={{ fontSize: "9pt", color: MUTED }}>
            {p.textoValorObs}
          </span>
        </div>

        <FooterAssinatura
          {...p}
          corLinha={GOLD}
          corTexto={CREAM}
          mutedColor={MUTED}
        />
      </div>
    </div>
  );
}

// ============================================================================
// HELPERS compartilhados
// ============================================================================

function Logo({
  branding,
  maxHeight,
  tint,
}: {
  branding: TenantBranding;
  maxHeight: string;
  tint?: "white";
}) {
  if (branding.logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={branding.logoUrl}
        alt={branding.nome}
        style={{
          height: maxHeight,
          maxWidth: "60mm",
          objectFit: "contain",
          filter: tint === "white" ? "brightness(0) invert(1)" : undefined,
        }}
      />
    );
  }
  return (
    <div
      style={{
        fontSize: "16pt",
        fontWeight: 700,
        letterSpacing: "0.05em",
      }}
    >
      {branding.nome.toUpperCase()}
    </div>
  );
}

function Kicker({
  text,
  color,
  mt,
}: {
  text: string;
  color: string;
  mt?: string;
}) {
  return (
    <div
      style={{
        fontSize: "9pt",
        letterSpacing: "0.4em",
        color,
        textTransform: "uppercase",
        marginTop: mt,
        fontFamily: "'Sora', sans-serif",
        fontWeight: 600,
      }}
    >
      {text}
    </div>
  );
}

function KickerSmall({ text, color }: { text: string; color: string }) {
  return (
    <div
      style={{
        fontSize: "8pt",
        letterSpacing: "0.3em",
        color,
        textTransform: "uppercase",
        fontFamily: "'Sora', sans-serif",
        fontWeight: 600,
      }}
    >
      {text}
    </div>
  );
}

function Divider({ color }: { color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6mm" }}>
      <div style={{ width: "20mm", height: "0.5px", backgroundColor: color }} />
      <div
        style={{
          width: "3mm",
          height: "3mm",
          borderRadius: "50%",
          backgroundColor: color,
        }}
      />
      <div style={{ width: "20mm", height: "0.5px", backgroundColor: color }} />
    </div>
  );
}

function CornerArt({
  position,
  color,
}: {
  position: "tl" | "tr" | "bl" | "br";
  color: string;
}) {
  const inset =
    position === "tl"
      ? { top: "12mm", left: "12mm" }
      : position === "tr"
        ? { top: "12mm", right: "12mm" }
        : position === "bl"
          ? { bottom: "12mm", left: "12mm" }
          : { bottom: "12mm", right: "12mm" };
  const flipX = position === "tr" || position === "br";
  const flipY = position === "bl" || position === "br";
  return (
    <svg
      width="24mm"
      height="24mm"
      viewBox="0 0 100 100"
      style={{
        position: "absolute",
        ...inset,
        transform: `scale(${flipX ? -1 : 1}, ${flipY ? -1 : 1})`,
      }}
    >
      <path
        d="M 0 30 Q 0 0 30 0 M 0 50 Q 0 10 50 10 M 10 70 Q 0 40 40 30"
        stroke={color}
        strokeWidth="0.8"
        fill="none"
      />
      <circle cx="0" cy="0" r="3" fill={color} opacity="0.4" />
    </svg>
  );
}

function Field({
  label,
  value,
  sub,
  navy,
  muted,
}: {
  label: string;
  value: string;
  sub: string;
  navy: string;
  muted: string;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: "8pt",
          letterSpacing: "0.2em",
          color: muted,
          textTransform: "uppercase",
          fontWeight: 600,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "12pt",
          fontWeight: 700,
          color: navy,
          marginTop: "2mm",
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: "9pt",
          color: muted,
          marginTop: "1mm",
          lineHeight: 1.4,
        }}
      >
        {sub}
      </div>
    </div>
  );
}

function FooterAssinatura(props: {
  dataLimite: string;
  telefoneContato: string;
  signatario: string;
  cargoSignatario: string;
  corLinha: string;
  corTexto: string;
  mutedColor: string;
}) {
  return (
    <div
      style={{
        marginTop: "auto",
        paddingTop: "8mm",
        borderTop: `0.5px solid ${props.corLinha}`,
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "4mm",
      }}
    >
      <div
        style={{
          fontSize: "9pt",
          color: props.mutedColor,
          fontFamily: "'Sora', sans-serif",
          textAlign: "center",
        }}
      >
        Confirme sua presença até <strong>{props.dataLimite}</strong>
        <br />
        <strong style={{ color: props.corTexto }}>
          {props.telefoneContato}
        </strong>
      </div>

      <div style={{ marginTop: "2mm" }}>
        <div
          style={{
            width: "60mm",
            height: "0.5px",
            backgroundColor: props.corTexto,
            margin: "0 auto 2mm auto",
          }}
        />
        <div
          style={{
            fontSize: "9pt",
            fontWeight: 600,
            color: props.corTexto,
            fontFamily: "'Sora', sans-serif",
          }}
        >
          {props.signatario}
        </div>
        <div
          style={{
            fontSize: "8pt",
            color: props.mutedColor,
            fontFamily: "'Sora', sans-serif",
            fontStyle: "italic",
          }}
        >
          {props.cargoSignatario}
        </div>
      </div>
    </div>
  );
}
