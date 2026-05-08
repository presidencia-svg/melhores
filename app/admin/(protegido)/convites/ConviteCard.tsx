import type { TenantBranding } from "@/lib/tenant/branding";

// Card de convite pro vencedor — A4 retrato (210x297mm). Design elegante
// inspirado em wedding invite/programa de gala, com espaco pra logo do
// tenant, nome do vencedor em destaque, categoria, detalhes do evento,
// inclusos, valor + RSVP.

export type ConviteCardProps = {
  branding: TenantBranding;
  nomeVencedor: string;
  categoria: string;
  grupo: string;
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
};

const NAVY = "#0c2a5b";
const GOLD = "#b8924a";
const GOLD_DARK = "#8a6a30";
const CREAM = "#fdfbf5";
const TEXT_MUTED = "#6b6b6b";

export function ConviteCard(props: ConviteCardProps) {
  const {
    branding,
    nomeVencedor,
    categoria,
    grupo,
    dataFesta,
    diaSemana,
    horario,
    local,
    enderecoLocal,
    valorMesa,
    pessoasPorMesa,
    dataLimite,
    telefoneContato,
    signatario,
    cargoSignatario,
  } = props;

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
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Borda dourada externa */}
      <div
        style={{
          position: "absolute",
          inset: "12mm",
          border: `1.5px solid ${GOLD}`,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: "14mm",
          border: `0.5px solid ${GOLD}`,
          pointerEvents: "none",
        }}
      />

      {/* Conteudo */}
      <div
        style={{
          flex: 1,
          padding: "24mm 22mm",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Logo do tenant */}
        <div style={{ marginTop: "4mm", marginBottom: "6mm" }}>
          {branding.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={branding.logoUrl}
              alt={branding.nome}
              style={{ height: "20mm", maxWidth: "60mm", objectFit: "contain" }}
            />
          ) : (
            <div
              style={{
                fontSize: "18pt",
                fontWeight: 700,
                color: NAVY,
                letterSpacing: "0.05em",
              }}
            >
              {branding.nome.toUpperCase()}
            </div>
          )}
        </div>

        {/* Titulo */}
        <div
          style={{
            fontSize: "9pt",
            letterSpacing: "0.4em",
            color: GOLD_DARK,
            textTransform: "uppercase",
            marginBottom: "4mm",
            fontFamily: "'Sora', sans-serif",
          }}
        >
          tem a honra de convidar
        </div>

        {/* Nome do vencedor — DESTAQUE */}
        <div
          style={{
            fontSize: "26pt",
            fontWeight: 800,
            fontStyle: "italic",
            color: NAVY,
            lineHeight: 1.1,
            margin: "2mm 0 4mm 0",
            maxWidth: "150mm",
          }}
        >
          {nomeVencedor}
        </div>

        {/* Categoria */}
        <div
          style={{
            fontSize: "10pt",
            color: TEXT_MUTED,
            marginBottom: "2mm",
            fontFamily: "'Sora', sans-serif",
          }}
        >
          eleito(a) o(a) Melhor do Ano em
        </div>
        <div
          style={{
            fontSize: "16pt",
            fontWeight: 600,
            color: GOLD_DARK,
            marginBottom: "1mm",
          }}
        >
          {categoria}
        </div>
        <div
          style={{
            fontSize: "9pt",
            color: TEXT_MUTED,
            marginBottom: "10mm",
            fontFamily: "'Sora', sans-serif",
            fontStyle: "italic",
          }}
        >
          {grupo}
        </div>

        {/* Divisoria ornamental */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6mm",
            marginBottom: "10mm",
          }}
        >
          <div
            style={{ width: "20mm", height: "0.5px", backgroundColor: GOLD }}
          />
          <div
            style={{
              width: "3mm",
              height: "3mm",
              borderRadius: "50%",
              backgroundColor: GOLD,
            }}
          />
          <div
            style={{ width: "20mm", height: "0.5px", backgroundColor: GOLD }}
          />
        </div>

        {/* Convite formal */}
        <div
          style={{
            fontSize: "11pt",
            lineHeight: 1.7,
            maxWidth: "150mm",
            marginBottom: "10mm",
            color: NAVY,
            fontFamily: "'Sora', sans-serif",
          }}
        >
          a comparecer à <strong>Festa de Premiação</strong> e Jantar de Gala
          do <em>{branding.nomeCampanha}</em>, ocasião em que será entregue a
          <strong> placa em inox de honra ao mérito</strong>, com
          superacabamento, em reconhecimento a essa conquista.
        </div>

        {/* Detalhes do evento — bloco destaque */}
        <div
          style={{
            border: `1px solid ${GOLD}`,
            padding: "8mm 12mm",
            marginBottom: "8mm",
            display: "flex",
            flexDirection: "column",
            gap: "3mm",
            minWidth: "120mm",
            backgroundColor: "rgba(184, 146, 74, 0.04)",
          }}
        >
          <div
            style={{
              fontSize: "8pt",
              letterSpacing: "0.3em",
              color: GOLD_DARK,
              textTransform: "uppercase",
              fontFamily: "'Sora', sans-serif",
              fontWeight: 600,
            }}
          >
            Detalhes do Evento
          </div>
          <div
            style={{
              fontSize: "14pt",
              fontWeight: 700,
              color: NAVY,
              lineHeight: 1.3,
            }}
          >
            {dataFesta}
          </div>
          <div
            style={{
              fontSize: "10pt",
              color: TEXT_MUTED,
              fontFamily: "'Sora', sans-serif",
              fontStyle: "italic",
            }}
          >
            {diaSemana} · às {horario}
          </div>
          <div
            style={{
              fontSize: "11pt",
              fontWeight: 600,
              color: NAVY,
              marginTop: "1mm",
            }}
          >
            {local}
          </div>
          <div
            style={{
              fontSize: "9pt",
              color: TEXT_MUTED,
              fontFamily: "'Sora', sans-serif",
            }}
          >
            {enderecoLocal}
          </div>
        </div>

        {/* Inclusos */}
        <div
          style={{
            fontSize: "10pt",
            color: NAVY,
            fontFamily: "'Sora', sans-serif",
            marginBottom: "8mm",
            display: "flex",
            gap: "5mm",
            flexWrap: "wrap",
            justifyContent: "center",
            maxWidth: "160mm",
          }}
        >
          <span>🏅 Placa de Honra ao Mérito</span>
          <span>🎶 Banda ao vivo</span>
          <span>🍽 Jantar completo</span>
          <span>🥂 Open bar</span>
        </div>

        {/* Valor + RSVP */}
        <div
          style={{
            fontSize: "11pt",
            color: NAVY,
            lineHeight: 1.6,
            fontFamily: "'Sora', sans-serif",
            marginBottom: "auto",
          }}
        >
          <strong style={{ color: GOLD_DARK }}>{valorMesa}</strong>
          {" · mesa para "}
          <strong>{pessoasPorMesa}</strong>
          <br />
          <span style={{ fontSize: "9pt", color: TEXT_MUTED }}>
            (placa de premiação + festa inclusos)
          </span>
        </div>

        {/* Rodape: RSVP + assinatura */}
        <div
          style={{
            marginTop: "8mm",
            paddingTop: "6mm",
            borderTop: `0.5px solid ${GOLD}`,
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
              color: TEXT_MUTED,
              fontFamily: "'Sora', sans-serif",
            }}
          >
            Confirme sua presença até <strong>{dataLimite}</strong>
            <br />
            <strong style={{ color: NAVY }}>{telefoneContato}</strong>
          </div>

          <div style={{ marginTop: "4mm" }}>
            <div
              style={{
                width: "60mm",
                height: "0.5px",
                backgroundColor: NAVY,
                margin: "0 auto 2mm auto",
              }}
            />
            <div
              style={{
                fontSize: "9pt",
                fontWeight: 600,
                color: NAVY,
                fontFamily: "'Sora', sans-serif",
              }}
            >
              {signatario}
            </div>
            <div
              style={{
                fontSize: "8pt",
                color: TEXT_MUTED,
                fontFamily: "'Sora', sans-serif",
                fontStyle: "italic",
              }}
            >
              {cargoSignatario}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
