// Feed posts (1080x1080) — 3 variations

// === Variation A: Editorial / Premium ===
// Big italic 2026, serif headline, gold accents on navy
const FeedA = () => (
  <div style={{
    width: 1080, height: 1080, position: "relative", overflow: "hidden",
    background: "linear-gradient(160deg, #0a2a5e 0%, #061d44 65%, #04122e 100%)",
    color: "#fbf8f1",
    fontFamily: "var(--font-sans)",
  }}>
    {/* radial light from bottom */}
    <div style={{
      position: "absolute", inset: 0,
      background: "radial-gradient(ellipse 80% 60% at 50% 105%, rgba(212,165,55,0.32), transparent 60%)",
    }}/>
    <div className="mda-rays"/>
    <div className="mda-grain"/>

    {/* corner ornaments */}
    <svg style={{ position: "absolute", top: 40, left: 40 }} width="80" height="80" viewBox="0 0 80 80" fill="none">
      <path d="M0 24 V0 H24" stroke="#d4a537" strokeWidth="2"/>
      <path d="M8 32 V8 H32" stroke="#d4a537" strokeWidth="1" opacity="0.5"/>
    </svg>
    <svg style={{ position: "absolute", top: 40, right: 40 }} width="80" height="80" viewBox="0 0 80 80" fill="none">
      <path d="M80 24 V0 H56" stroke="#d4a537" strokeWidth="2"/>
      <path d="M72 32 V8 H48" stroke="#d4a537" strokeWidth="1" opacity="0.5"/>
    </svg>
    <svg style={{ position: "absolute", bottom: 40, left: 40 }} width="80" height="80" viewBox="0 0 80 80" fill="none">
      <path d="M0 56 V80 H24" stroke="#d4a537" strokeWidth="2"/>
    </svg>
    <svg style={{ position: "absolute", bottom: 40, right: 40 }} width="80" height="80" viewBox="0 0 80 80" fill="none">
      <path d="M80 56 V80 H56" stroke="#d4a537" strokeWidth="2"/>
    </svg>

    {/* top kicker */}
    <div style={{ position: "absolute", top: 90, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
      <SmallCaps color="#d4a537" tracking="0.55em" size={18}>Edição XXXIV · CDL Aracaju</SmallCaps>
      <Divider width={50} color="#d4a537" thickness={1}/>
    </div>

    {/* big italic numerals */}
    <div style={{ position: "absolute", top: 200, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: 0.10 }}>
      <Numerals size={520} color="#d4a537"/>
    </div>

    {/* center stack */}
    <div style={{
      position: "absolute", inset: 0, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 24, padding: "0 100px",
    }}>
      <div style={{ marginBottom: 12 }}>
        <LaurelWreath size={140} color="#d4a537"/>
      </div>
      <div style={{
        fontFamily: "var(--font-display)", fontWeight: 400, fontStyle: "italic",
        fontSize: 92, lineHeight: 0.95, textAlign: "center", letterSpacing: "-0.02em",
      }}>
        <div style={{ fontWeight: 300 }}>Os melhores</div>
        <div style={{ fontWeight: 700, color: "#e6bf5f" }}>do ano</div>
      </div>
      <div style={{ marginTop: 8 }}>
        <Divider width={40} color="#d4a537" thickness={1}/>
      </div>
      <SmallCaps color="rgba(255,255,255,0.7)" size={14} tracking="0.45em">votação aberta</SmallCaps>
      <div style={{
        fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 600,
        fontSize: 38, color: "#fbf8f1",
      }}>Quem você admira em Aracaju?</div>
    </div>

    {/* bottom: URL pill */}
    <div style={{ position: "absolute", bottom: 110, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "18px 36px", border: "1.5px solid #d4a537",
        borderRadius: 999, background: "rgba(212,165,55,0.06)",
        backdropFilter: "blur(4px)",
      }}>
        <SmallCaps color="#d4a537" size={16} tracking="0.3em">vote em</SmallCaps>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 18, color: "#fbf8f1" }}>votar.cdlaju.com.br</div>
      </div>
    </div>

    {/* realização */}
    <div style={{ position: "absolute", bottom: 50, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
      <Realizacao variant="light" size="sm"/>
    </div>
  </div>
);

// === Variation B: Bold display / typographic ===
// Cream paper background, massive serif "MELHORES" and oversized 2026
const FeedB = () => (
  <div style={{
    width: 1080, height: 1080, position: "relative", overflow: "hidden",
    background: "#f5f1e8", color: "#0a2a5e",
    fontFamily: "var(--font-sans)",
  }}>
    {/* deckle texture */}
    <div style={{
      position: "absolute", inset: 0, opacity: 0.04,
      backgroundImage: "radial-gradient(#0a2a5e 1px, transparent 1px)",
      backgroundSize: "5px 5px",
    }}/>

    {/* navy band top */}
    <div style={{
      position: "absolute", top: 0, left: 0, right: 0, height: 90,
      background: "#0a2a5e", display: "flex", alignItems: "center",
      justifyContent: "space-between", padding: "0 60px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ background: "#fbf8f1", padding: "4px 10px", borderRadius: 3 }}>
          <img src="assets/cdl-logo.png" alt="CDL" style={{ height: 28, display: "block" }}/>
        </div>
        <div style={{ width: 1, height: 22, background: "rgba(212,165,55,0.4)" }}/>
        <SmallCaps color="#d4a537" tracking="0.35em" size={11}>34ª edição</SmallCaps>
      </div>
      <SmallCaps color="#fbf8f1" tracking="0.35em" size={14}>votar.cdlaju.com.br</SmallCaps>
    </div>

    {/* big italic 2026 outlined */}
    <div style={{
      position: "absolute", top: 130, left: 60, right: 60,
      display: "flex", justifyContent: "center", pointerEvents: "none",
    }}>
      <div style={{
        fontFamily: "var(--font-display)", fontWeight: 900, fontStyle: "italic",
        fontSize: 380, lineHeight: 0.85, color: "transparent",
        WebkitTextStroke: "2.5px #d4a537", letterSpacing: "-0.04em",
      }}>2026</div>
    </div>

    {/* main word stack */}
    <div style={{
      position: "absolute", top: 235, left: 60, right: 60,
      display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
    }}>
      <div style={{
        fontFamily: "var(--font-display)", fontWeight: 900,
        fontSize: 168, lineHeight: 0.88, letterSpacing: "-0.04em",
        color: "#0a2a5e", textAlign: "center",
      }}>
        MELHORES
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <div style={{ height: 1.5, width: 80, background: "#0a2a5e" }}/>
        <SmallCaps color="#0a2a5e" size={16} tracking="0.5em">do ano</SmallCaps>
        <div style={{ height: 1.5, width: 80, background: "#0a2a5e" }}/>
      </div>
    </div>

    {/* center: trophy + tagline */}
    <div style={{
      position: "absolute", top: 540, left: 60, right: 60,
      display: "flex", flexDirection: "column", alignItems: "center", gap: 28,
    }}>
      <div style={{
        width: 120, height: 120, borderRadius: "50%",
        background: "#0a2a5e", display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 12px 40px rgba(10,42,94,0.3)",
      }}>
        <TrophyMark size={62} color="#d4a537"/>
      </div>
      <div style={{
        fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 500,
        fontSize: 44, color: "#0a2a5e", textAlign: "center", lineHeight: 1.15,
        maxWidth: 720,
      }}>
        Você decide os destaques<br/>de Aracaju.
      </div>
    </div>

    {/* bottom CTA */}
    <div style={{
      position: "absolute", bottom: 70, left: 60, right: 60,
      display: "flex", flexDirection: "column", alignItems: "center", gap: 14,
    }}>
      <div style={{
        background: "#d4a537", color: "#0a2a5e",
        padding: "22px 48px", borderRadius: 4,
        fontFamily: "var(--font-sans)", fontWeight: 700,
        fontSize: 20, letterSpacing: "0.18em", textTransform: "uppercase",
      }}>Vote agora · 3 minutos</div>
      <SmallCaps color="#0a2a5e" tracking="0.3em" size={11} weight={500}>
        88 categorias · 100% online · gratuito
      </SmallCaps>
    </div>
  </div>
);

// === Variation C: Modern / asymmetric grid ===
// Split layout: left navy, right cream — for visual interest
const FeedC = () => (
  <div style={{
    width: 1080, height: 1080, position: "relative", overflow: "hidden",
    fontFamily: "var(--font-sans)",
    display: "grid", gridTemplateColumns: "1fr 1fr",
  }}>
    {/* left panel - navy */}
    <div style={{
      background: "linear-gradient(180deg, #0a2a5e 0%, #061d44 100%)",
      color: "#fbf8f1", position: "relative", padding: "60px 40px", overflow: "hidden",
    }}>
      <div className="mda-grain"/>
      <SmallCaps color="#d4a537" size={13} tracking="0.45em">2026 · 34ª ed.</SmallCaps>
      <div style={{
        position: "absolute", bottom: 60, left: 40, right: 40,
        fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 400,
        fontSize: 92, lineHeight: 0.92, color: "#fbf8f1", letterSpacing: "-0.02em",
      }}>
        <div>Os</div>
        <div style={{ color: "#e6bf5f", fontWeight: 700 }}>melhores</div>
        <div>do ano</div>
      </div>

      {/* gold tick at top right of panel */}
      <div style={{
        position: "absolute", top: 60, right: 0, width: 60, height: 2, background: "#d4a537",
      }}/>
    </div>

    {/* right panel - cream */}
    <div style={{
      background: "#f5f1e8", color: "#0a2a5e", position: "relative",
      padding: "60px 40px", overflow: "hidden",
    }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <div style={{
          width: 88, height: 88, borderRadius: "50%",
          background: "#0a2a5e", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <TrophyMark size={44} color="#d4a537"/>
        </div>
      </div>

      {/* gigantic sideways 2026 */}
      <div style={{
        position: "absolute", top: 200, left: -60,
        fontFamily: "var(--font-display)", fontWeight: 900, fontStyle: "italic",
        fontSize: 380, lineHeight: 0.8, color: "#0a2a5e", opacity: 0.07,
        letterSpacing: "-0.04em",
      }}>2026</div>

      {/* category badges */}
      <div style={{
        position: "absolute", top: 240, left: 40, right: 40,
        display: "flex", flexWrap: "wrap", gap: 8,
      }}>
        {["Restaurante", "Salão", "Loja", "Hotel", "Academia", "Médico", "Pet Shop", "Padaria", "Mecânica", "Dentista"].map(c => (
          <span key={c} style={{
            fontSize: 13, padding: "5px 11px", border: "1px solid #0a2a5e",
            borderRadius: 999, color: "#0a2a5e", fontWeight: 500,
          }}>{c}</span>
        ))}
        <span style={{
          fontSize: 13, padding: "5px 11px", borderRadius: 999,
          background: "#0a2a5e", color: "#d4a537", fontWeight: 600,
        }}>+78</span>
      </div>

      <div style={{
        position: "absolute", bottom: 200, left: 40, right: 40,
        fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 500,
        fontSize: 36, lineHeight: 1.1, color: "#0a2a5e",
      }}>
        Quem merece ser<br/>destaque?
      </div>

      <div style={{
        position: "absolute", bottom: 60, left: 40, right: 40,
      }}>
        <Divider width={30} color="#0a2a5e"/>
        <div style={{ marginTop: 14, fontFamily: "var(--font-mono)", fontSize: 16, color: "#0a2a5e" }}>
          votar.cdlaju.com.br
        </div>
        <SmallCaps color="#b88a2a" size={11} tracking="0.3em" style={{ marginTop: 6 }}>
          vote agora
        </SmallCaps>
        <div style={{ marginTop: 22 }}>
          <Realizacao variant="dark" size="sm"/>
        </div>
      </div>
    </div>

    {/* center connector circle */}
    <div style={{
      position: "absolute", top: "50%", left: "50%",
      transform: "translate(-50%,-50%)", width: 180, height: 180, borderRadius: "50%",
      background: "#d4a537", display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: "0 0 0 8px #f5f1e8, 0 20px 50px rgba(0,0,0,0.25)",
      flexDirection: "column", gap: 4,
    }}>
      <SmallCaps color="#0a2a5e" size={11} tracking="0.4em">vote</SmallCaps>
      <div style={{
        fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 800,
        fontSize: 56, color: "#0a2a5e", lineHeight: 1,
      }}>2026</div>
    </div>
  </div>
);

Object.assign(window, { FeedA, FeedB, FeedC });
