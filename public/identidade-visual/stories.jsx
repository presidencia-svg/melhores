// Stories (1080x1920) and "Eu Votei!" post

// === Story A: Premium vertical ===
const StoryA = () => (
  <div style={{
    width: 1080, height: 1920, position: "relative", overflow: "hidden",
    background: "linear-gradient(180deg, #061d44 0%, #0a2a5e 50%, #04122e 100%)",
    color: "#fbf8f1", fontFamily: "var(--font-sans)",
  }}>
    <div className="mda-rays"/>
    <div className="mda-grain"/>

    {/* top tag */}
    <div style={{
      position: "absolute", top: 120, left: 0, right: 0,
      display: "flex", flexDirection: "column", alignItems: "center", gap: 22,
    }}>
      <div style={{
        padding: "10px 22px", border: "1px solid #d4a537", borderRadius: 999,
      }}>
        <SmallCaps color="#d4a537" size={14} tracking="0.4em">votação aberta</SmallCaps>
      </div>
      <SmallCaps color="rgba(255,255,255,0.7)" size={13} tracking="0.5em">
        CDL Aracaju · 34ª edição
      </SmallCaps>
    </div>

    {/* huge 2026 background */}
    <div style={{
      position: "absolute", top: 320, left: 0, right: 0,
      display: "flex", justifyContent: "center", opacity: 0.10, pointerEvents: "none",
    }}>
      <Numerals size={620} color="#d4a537"/>
    </div>

    {/* central composition */}
    <div style={{
      position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 36,
    }}>
      <LaurelWreath size={200} color="#d4a537"/>
      <div style={{
        fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 300,
        fontSize: 130, lineHeight: 0.9, textAlign: "center", letterSpacing: "-0.02em",
      }}>Os melhores</div>
      <div style={{
        fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 800,
        fontSize: 180, lineHeight: 0.9, color: "#e6bf5f", letterSpacing: "-0.03em",
        marginTop: -20,
      }}>do ano</div>
      <Divider width={70} color="#d4a537"/>
      <div style={{
        fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 500,
        fontSize: 56, color: "#fbf8f1", textAlign: "center", maxWidth: 800,
      }}>
        quem você admira<br/>em Aracaju?
      </div>
    </div>

    {/* bottom CTA stack */}
    <div style={{
      position: "absolute", bottom: 180, left: 60, right: 60,
      display: "flex", flexDirection: "column", alignItems: "center", gap: 24,
    }}>
      <div style={{
        background: "#d4a537", color: "#0a2a5e",
        padding: "32px 0", borderRadius: 6, width: "100%", textAlign: "center",
        fontWeight: 700, fontSize: 32, letterSpacing: "0.18em", textTransform: "uppercase",
      }}>Vote agora</div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, opacity: 0.85 }}>
        <SmallCaps size={18} tracking="0.35em" color="#fbf8f1">arraste para cima</SmallCaps>
      </div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 22, color: "#fbf8f1" }}>
        votar.cdlaju.com.br
      </div>
    </div>

    {/* arrow up */}
    <div style={{
      position: "absolute", bottom: 80, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 80, alignItems: "center",
    }}>
      <Realizacao variant="light" size="sm"/>
    </div>
  </div>
);

// === Story B: Editorial split ===
const StoryB = () => (
  <div style={{
    width: 1080, height: 1920, position: "relative", overflow: "hidden",
    fontFamily: "var(--font-sans)",
    background: "#f5f1e8",
  }}>
    {/* top navy block */}
    <div style={{
      position: "absolute", top: 0, left: 0, right: 0, height: 950,
      background: "linear-gradient(180deg, #0a2a5e 0%, #061d44 100%)",
      color: "#fbf8f1", padding: 80, overflow: "hidden",
    }}>
      <div className="mda-grain"/>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 80 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ background: "#fbf8f1", padding: "6px 12px", borderRadius: 3 }}>
            <img src="assets/cdl-logo.png" alt="CDL" style={{ height: 36, display: "block" }}/>
          </div>
          <SmallCaps color="#d4a537" size={13} tracking="0.4em">2026</SmallCaps>
        </div>
        <SmallCaps color="rgba(255,255,255,0.6)" size={14} tracking="0.4em">34ª ed.</SmallCaps>
      </div>

      {/* outlined 2026 */}
      <div style={{
        position: "absolute", top: 200, left: 80, right: 80,
        fontFamily: "var(--font-display)", fontWeight: 900, fontStyle: "italic",
        fontSize: 460, lineHeight: 0.85, color: "transparent",
        WebkitTextStroke: "2px #d4a537", letterSpacing: "-0.04em",
        textAlign: "center",
      }}>2026</div>

      <div style={{
        position: "absolute", bottom: 80, left: 80, right: 80,
        fontFamily: "var(--font-display)", fontStyle: "italic",
        fontSize: 140, lineHeight: 0.92, letterSpacing: "-0.03em",
      }}>
        <div style={{ fontWeight: 300 }}>Os</div>
        <div style={{ fontWeight: 800, color: "#e6bf5f" }}>melhores</div>
        <div style={{ fontWeight: 300 }}>do ano</div>
      </div>
    </div>

    {/* middle: medallion bridging */}
    <div style={{
      position: "absolute", top: 870, left: "50%", transform: "translateX(-50%)",
      width: 200, height: 200, borderRadius: "50%",
      background: "#d4a537", border: "8px solid #f5f1e8",
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: "0 20px 60px rgba(10,42,94,0.4)",
    }}>
      <TrophyMark size={100} color="#0a2a5e"/>
    </div>

    {/* bottom cream */}
    <div style={{
      position: "absolute", top: 950, left: 0, right: 0, bottom: 0,
      padding: "180px 80px 80px",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 32,
      color: "#0a2a5e",
    }}>
      <div style={{
        fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 500,
        fontSize: 60, textAlign: "center", lineHeight: 1.1, maxWidth: 800,
      }}>
        Você decide os destaques<br/>de Aracaju.
      </div>

      <Divider width={60} color="#0a2a5e"/>

      {/* stat row */}
      <div style={{ display: "flex", gap: 50, marginTop: 20 }}>
        {[
          { n: "88", l: "categorias" },
          { n: "10", l: "setores" },
          { n: "3 min", l: "para votar" },
        ].map(s => (
          <div key={s.l} style={{ textAlign: "center" }}>
            <div style={{
              fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 800,
              fontSize: 64, color: "#0a2a5e", lineHeight: 1,
            }}>{s.n}</div>
            <SmallCaps color="#b88a2a" size={11} tracking="0.3em" style={{ marginTop: 6 }}>{s.l}</SmallCaps>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
        <div style={{
          background: "#0a2a5e", color: "#d4a537",
          padding: "26px 80px", borderRadius: 4,
          fontWeight: 700, fontSize: 26, letterSpacing: "0.18em", textTransform: "uppercase",
        }}>Vote agora</div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 22, color: "#0a2a5e" }}>
          votar.cdlaju.com.br
        </div>
      </div>
    </div>
  </div>
);

// === Eu Votei! 1080x1080 ===
const EuVotei = () => (
  <div style={{
    width: 1080, height: 1080, position: "relative", overflow: "hidden",
    background: "linear-gradient(160deg, #0f8a3f 0%, #0a6a30 100%)",
    color: "#fbf8f1", fontFamily: "var(--font-sans)",
  }}>
    {/* light from top right */}
    <div style={{
      position: "absolute", inset: 0,
      background: "radial-gradient(ellipse 70% 50% at 80% 20%, rgba(212,165,55,0.35), transparent 60%)",
    }}/>
    <div className="mda-grain"/>

    {/* corner ticks */}
    <svg style={{ position: "absolute", top: 40, left: 40 }} width="60" height="60" viewBox="0 0 60 60" fill="none">
      <path d="M0 16 V0 H16" stroke="#d4a537" strokeWidth="2"/>
    </svg>
    <svg style={{ position: "absolute", top: 40, right: 40 }} width="60" height="60" viewBox="0 0 60 60" fill="none">
      <path d="M60 16 V0 H44" stroke="#d4a537" strokeWidth="2"/>
    </svg>
    <svg style={{ position: "absolute", bottom: 40, left: 40 }} width="60" height="60" viewBox="0 0 60 60" fill="none">
      <path d="M0 44 V60 H16" stroke="#d4a537" strokeWidth="2"/>
    </svg>
    <svg style={{ position: "absolute", bottom: 40, right: 40 }} width="60" height="60" viewBox="0 0 60 60" fill="none">
      <path d="M60 44 V60 H44" stroke="#d4a537" strokeWidth="2"/>
    </svg>

    <div style={{
      position: "absolute", top: 90, left: 0, right: 0, display: "flex", justifyContent: "center",
    }}>
      <SmallCaps color="#d4a537" size={16} tracking="0.5em">CDL Aracaju · 2026</SmallCaps>
    </div>

    {/* huge check */}
    <div style={{
      position: "absolute", top: 180, left: 0, right: 0, display: "flex", justifyContent: "center",
    }}>
      <div style={{
        width: 200, height: 200, borderRadius: "50%",
        background: "#d4a537", display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3), inset 0 -8px 20px rgba(0,0,0,0.15)",
        border: "6px solid rgba(255,255,255,0.2)",
      }}>
        <svg width="110" height="110" viewBox="0 0 110 110" fill="none">
          <path d="M22 56 L46 80 L88 30" stroke="#0a2a5e" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>

    {/* Eu votei lockup */}
    <div style={{
      position: "absolute", top: 430, left: 0, right: 0,
      display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
    }}>
      <div style={{
        fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 300,
        fontSize: 96, color: "#fbf8f1", letterSpacing: "-0.02em",
      }}>eu</div>
      <div style={{
        fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 800,
        fontSize: 200, color: "#fbf8f1", lineHeight: 0.9, letterSpacing: "-0.03em",
      }}>votei!</div>
    </div>

    <div style={{
      position: "absolute", top: 760, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 18,
    }}>
      <Divider width={50} color="#d4a537"/>
      <div style={{
        fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 500,
        fontSize: 40, color: "#fbf8f1", textAlign: "center", maxWidth: 720, lineHeight: 1.2,
      }}>
        Nos melhores do ano<br/>de Aracaju.
      </div>
    </div>

    {/* bottom CTA */}
    <div style={{
      position: "absolute", bottom: 90, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 14,
    }}>
      <SmallCaps size={13} color="rgba(255,255,255,0.75)" tracking="0.4em">vote você também</SmallCaps>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 20, color: "#d4a537" }}>
        votar.cdlaju.com.br
      </div>
      <div style={{ marginTop: 14 }}>
        <Realizacao variant="light" size="sm"/>
      </div>
    </div>
  </div>
);

Object.assign(window, { StoryA, StoryB, EuVotei });
