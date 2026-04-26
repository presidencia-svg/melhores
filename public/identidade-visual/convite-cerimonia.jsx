// Convite digital (1080x1350 - portrait social) and Cerimônia (1920x1080 - tela)

const ConviteDigital = () => (
  <div style={{
    width: 1080, height: 1350, position: "relative", overflow: "hidden",
    background: "linear-gradient(180deg, #061d44 0%, #0a2a5e 100%)",
    color: "#fbf8f1", fontFamily: "var(--font-sans)",
  }}>
    <div className="mda-rays"/>
    <div className="mda-grain"/>

    {/* gold border frame */}
    <div style={{
      position: "absolute", inset: 40, border: "1.5px solid #d4a537",
      pointerEvents: "none",
    }}/>
    <div style={{
      position: "absolute", inset: 50, border: "0.5px solid rgba(212,165,55,0.4)",
      pointerEvents: "none",
    }}/>

    {/* corner ornaments inside frame */}
    {[
      [55, 55, 0], [55, 55, 90], [55, 55, 270], [55, 55, 180],
    ].map(([t, l, r], i) => {
      const positions = [
        { top: 55, left: 55 }, { top: 55, right: 55 },
        { bottom: 55, left: 55 }, { bottom: 55, right: 55 },
      ];
      return (
        <div key={i} style={{ position: "absolute", ...positions[i] }}>
          <svg width="50" height="50" viewBox="0 0 50 50" fill="none"
               style={{ transform: `rotate(${i*90}deg)` }}>
            <path d="M0 0 L20 0 M0 0 L0 20" stroke="#d4a537" strokeWidth="1"/>
            <circle cx="0" cy="0" r="3" fill="#d4a537"/>
          </svg>
        </div>
      );
    })}

    {/* top kicker */}
    <div style={{
      position: "absolute", top: 110, left: 0, right: 0,
      display: "flex", flexDirection: "column", alignItems: "center", gap: 24,
    }}>
      <SmallCaps color="#d4a537" size={15} tracking="0.5em">convite</SmallCaps>
      <Divider width={40} color="#d4a537"/>
      <SmallCaps color="rgba(255,255,255,0.7)" size={12} tracking="0.45em">
        cerimônia de premiação · 34ª edição
      </SmallCaps>
    </div>

    {/* central monogram */}
    <div style={{
      position: "absolute", top: 280, left: 0, right: 0, display: "flex", justifyContent: "center",
    }}>
      <LaurelWreath size={140} color="#d4a537"/>
    </div>

    <div style={{
      position: "absolute", top: 460, left: 60, right: 60,
      display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
    }}>
      <div style={{
        fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 300,
        fontSize: 70, lineHeight: 1, letterSpacing: "-0.02em",
      }}>Os melhores</div>
      <div style={{
        fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 800,
        fontSize: 140, color: "#e6bf5f", lineHeight: 0.9, letterSpacing: "-0.03em",
      }}>do ano</div>
      <div style={{ marginTop: 8 }}>
        <Numerals size={120} color="#d4a537"/>
      </div>
    </div>

    {/* event details */}
    <div style={{
      position: "absolute", top: 920, left: 60, right: 60,
      display: "flex", flexDirection: "column", alignItems: "center", gap: 22,
    }}>
      <Divider width={60} color="#d4a537"/>

      <div style={{ display: "flex", gap: 60, alignItems: "flex-start" }}>
        <div style={{ textAlign: "center" }}>
          <SmallCaps color="rgba(255,255,255,0.55)" size={11} tracking="0.4em">data</SmallCaps>
          <div style={{
            fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 600,
            fontSize: 36, color: "#fbf8f1", marginTop: 8, lineHeight: 1.1,
          }}>14 maio</div>
          <div style={{ fontFamily: "var(--font-sans)", fontWeight: 400, fontSize: 14, color: "rgba(255,255,255,0.65)", marginTop: 4 }}>
            quinta-feira
          </div>
        </div>
        <div style={{ width: 1, height: 60, background: "rgba(212,165,55,0.4)", marginTop: 18 }}/>
        <div style={{ textAlign: "center" }}>
          <SmallCaps color="rgba(255,255,255,0.55)" size={11} tracking="0.4em">hora</SmallCaps>
          <div style={{
            fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 600,
            fontSize: 36, color: "#fbf8f1", marginTop: 8, lineHeight: 1.1,
          }}>20h</div>
          <div style={{ fontFamily: "var(--font-sans)", fontWeight: 400, fontSize: 14, color: "rgba(255,255,255,0.65)", marginTop: 4 }}>
            recepção 19h
          </div>
        </div>
        <div style={{ width: 1, height: 60, background: "rgba(212,165,55,0.4)", marginTop: 18 }}/>
        <div style={{ textAlign: "center" }}>
          <SmallCaps color="rgba(255,255,255,0.55)" size={11} tracking="0.4em">local</SmallCaps>
          <div style={{
            fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 600,
            fontSize: 30, color: "#fbf8f1", marginTop: 8, lineHeight: 1.1,
          }}>Teatro<br/>Tobias Barreto</div>
        </div>
      </div>

      <Divider width={60} color="#d4a537"/>
    </div>

    {/* RSVP */}
    <div style={{
      position: "absolute", bottom: 110, left: 60, right: 60,
      display: "flex", flexDirection: "column", alignItems: "center", gap: 14,
    }}>
      <SmallCaps color="rgba(255,255,255,0.7)" size={11} tracking="0.4em">confirme presença</SmallCaps>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 18, color: "#d4a537" }}>
        cdlaju.com.br/rsvp
      </div>
      <div style={{ marginTop: 18 }}>
        <Realizacao variant="light" size="sm" layout="stacked"/>
      </div>
    </div>
  </div>
);

// Cerimônia: 1920x1080 telão — vencedor sendo anunciado
const CerimoniaTela = () => (
  <div style={{
    width: 1920, height: 1080, position: "relative", overflow: "hidden",
    background: "linear-gradient(135deg, #061d44 0%, #0a2a5e 50%, #04122e 100%)",
    color: "#fbf8f1", fontFamily: "var(--font-sans)",
  }}>
    <div className="mda-rays"/>
    <div className="mda-grain"/>

    {/* spotlight */}
    <div style={{
      position: "absolute", inset: 0,
      background: "radial-gradient(ellipse 60% 80% at 50% 50%, rgba(212,165,55,0.18), transparent 60%)",
    }}/>

    {/* top frame */}
    <div style={{
      position: "absolute", top: 60, left: 80, right: 80, display: "flex",
      justifyContent: "space-between", alignItems: "center",
    }}>
      <SmallCaps color="#d4a537" size={16} tracking="0.5em">Melhores do Ano · 2026</SmallCaps>
      <SmallCaps color="rgba(255,255,255,0.55)" size={14} tracking="0.45em">CDL Aracaju · 34ª edição</SmallCaps>
    </div>

    {/* category banner */}
    <div style={{
      position: "absolute", top: 150, left: 0, right: 0,
      display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
    }}>
      <Divider width={80} color="#d4a537"/>
      <SmallCaps color="rgba(255,255,255,0.7)" size={20} tracking="0.55em">categoria</SmallCaps>
      <div style={{
        fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 500,
        fontSize: 58, color: "#fbf8f1",
      }}>
        Restaurante
      </div>
      <SmallCaps color="rgba(255,255,255,0.45)" size={13} tracking="0.4em">setor · alimentação</SmallCaps>
    </div>

    {/* winner card */}
    <div style={{
      position: "absolute", top: 500, left: 0, right: 0,
      display: "flex", justifyContent: "center", alignItems: "center", gap: 60,
    }}>
      <LaurelHalf size={200} color="#d4a537"/>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
        <SmallCaps color="#d4a537" size={18} tracking="0.6em">o melhor de 2026</SmallCaps>
        <div style={{
          fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 800,
          fontSize: 130, color: "#fbf8f1", letterSpacing: "-0.02em", lineHeight: 1,
          textShadow: "0 4px 30px rgba(212,165,55,0.4)",
        }}>
          [Nome do<br/>vencedor]
        </div>
      </div>

      <LaurelHalf size={200} color="#d4a537" flip/>
    </div>

    {/* footer */}
    <div style={{
      position: "absolute", bottom: 60, left: 80, right: 80,
      display: "flex", justifyContent: "space-between", alignItems: "center",
    }}>
      <Realizacao variant="light" size="md"/>
      <SmallCaps color="rgba(255,255,255,0.45)" size={12} tracking="0.4em">votar.cdlaju.com.br</SmallCaps>
    </div>
  </div>
);

Object.assign(window, { ConviteDigital, CerimoniaTela });
