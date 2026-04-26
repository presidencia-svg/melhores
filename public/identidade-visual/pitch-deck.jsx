// Pitch deck para patrocinadores — 5 slides 1920x1080

const Slide1Cover = () => (
  <div style={{
    width: 1920, height: 1080, position: "relative", overflow: "hidden",
    background: "linear-gradient(135deg, #061d44 0%, #0a2a5e 50%, #04122e 100%)",
    color: "#fbf8f1", fontFamily: "var(--font-sans)",
  }}>
    <div className="mda-rays"/>
    <div className="mda-grain"/>
    <div style={{
      position: "absolute", inset: 0,
      background: "radial-gradient(ellipse 50% 60% at 70% 50%, rgba(212,165,55,0.20), transparent 60%)",
    }}/>

    {/* top */}
    <div style={{
      position: "absolute", top: 60, left: 80, right: 80,
      display: "flex", justifyContent: "space-between", alignItems: "center",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ background: "#fbf8f1", padding: "6px 14px", borderRadius: 3 }}>
          <img src="assets/cdl-logo.png" alt="CDL Aracaju" style={{ height: 40, display: "block" }}/>
        </div>
        <div style={{ width: 1, height: 32, background: "rgba(212,165,55,0.4)" }}/>
        <SmallCaps color="#d4a537" tracking="0.5em" size={12}>cota patrocínio · 2026</SmallCaps>
      </div>
      <SmallCaps color="rgba(255,255,255,0.5)" tracking="0.4em" size={12}>34ª edição</SmallCaps>
    </div>

    {/* huge 2026 backdrop */}
    <div style={{
      position: "absolute", right: -80, top: 100, opacity: 0.10,
    }}>
      <Numerals size={780} color="#d4a537"/>
    </div>

    {/* main title */}
    <div style={{
      position: "absolute", top: 280, left: 120, maxWidth: 1100,
    }}>
      <Divider width={80} color="#d4a537"/>
      <div style={{
        fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 300,
        fontSize: 120, lineHeight: 0.92, marginTop: 36, letterSpacing: "-0.02em",
      }}>Os melhores</div>
      <div style={{
        fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 800,
        fontSize: 220, color: "#e6bf5f", lineHeight: 0.85, letterSpacing: "-0.03em",
        marginTop: -4,
      }}>do ano</div>
      <div style={{
        marginTop: 36, fontFamily: "var(--font-display)", fontStyle: "italic",
        fontSize: 38, color: "rgba(255,255,255,0.78)", maxWidth: 700, lineHeight: 1.2,
      }}>
        Sua marca ao lado dos negócios mais admirados de Aracaju.
      </div>
    </div>

    {/* footer */}
    <div style={{
      position: "absolute", bottom: 60, left: 80, right: 80,
      display: "flex", justifyContent: "space-between", alignItems: "flex-end",
    }}>
      <div>
        <SmallCaps color="rgba(255,255,255,0.5)" tracking="0.4em" size={11}>apresentação</SmallCaps>
        <div style={{
          fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 22,
          color: "#fbf8f1", marginTop: 6,
        }}>Plano de patrocínio</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Realizacao variant="light" size="sm"/>
      </div>
    </div>
  </div>
);

const Slide2WhatIs = () => (
  <div style={{
    width: 1920, height: 1080, position: "relative", overflow: "hidden",
    background: "#f5f1e8", color: "#0a2a5e", fontFamily: "var(--font-sans)", padding: "80px 120px",
  }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <SmallCaps color="#b88a2a" tracking="0.45em" size={13}>01 · o prêmio</SmallCaps>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <SmallCaps color="rgba(10,42,94,0.5)" tracking="0.4em" size={11}>realização</SmallCaps>
        <img src="assets/cdl-logo.png" alt="CDL" style={{ height: 32, display: "block" }}/>
      </div>
    </div>

    <div style={{ marginTop: 80, display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 100 }}>
      <div>
        <div style={{
          fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 300,
          fontSize: 100, lineHeight: 0.92, letterSpacing: "-0.02em",
        }}>
          O reconhecimento<br/>
          <span style={{ fontWeight: 800, color: "#0a2a5e" }}>mais querido</span><br/>
          de Sergipe.
        </div>
        <div style={{
          marginTop: 50, fontFamily: "var(--font-sans)", fontSize: 22,
          lineHeight: 1.55, color: "rgba(10,42,94,0.78)", maxWidth: 580,
        }}>
          Há 34 anos a CDL Aracaju ouve a cidade e premia os negócios que marcam
          a vida de quem mora aqui. Em 2026, mais de <b>88 categorias</b>, escolhidas
          pelos próprios consumidores, em uma votação 100% online.
        </div>
      </div>

      <div style={{
        background: "#0a2a5e", color: "#fbf8f1", padding: "60px 50px", borderRadius: 4,
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", right: -40, top: -40, opacity: 0.15,
        }}>
          <TrophyMark size={300} color="#d4a537"/>
        </div>
        <SmallCaps color="#d4a537" tracking="0.4em" size={13}>em números</SmallCaps>
        <div style={{ marginTop: 36, display: "flex", flexDirection: "column", gap: 32 }}>
          {[
            { n: "88", l: "categorias votadas pela cidade" },
            { n: "120k+", l: "votos esperados em 2026" },
            { n: "34ª", l: "edição consecutiva do prêmio" },
            { n: "10", l: "setores da economia" },
          ].map(s => (
            <div key={s.l} style={{ display: "flex", alignItems: "baseline", gap: 24, borderBottom: "1px solid rgba(212,165,55,0.25)", paddingBottom: 18 }}>
              <div style={{
                fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 700,
                fontSize: 64, color: "#e6bf5f", minWidth: 140,
              }}>{s.n}</div>
              <div style={{ fontSize: 17, color: "rgba(255,255,255,0.85)", lineHeight: 1.4 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const Slide3Audience = () => (
  <div style={{
    width: 1920, height: 1080, position: "relative", overflow: "hidden",
    background: "linear-gradient(135deg, #061d44 0%, #0a2a5e 100%)",
    color: "#fbf8f1", fontFamily: "var(--font-sans)", padding: "80px 120px",
  }}>
    <div className="mda-grain"/>

    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <SmallCaps color="#d4a537" tracking="0.45em" size={13}>02 · alcance</SmallCaps>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <SmallCaps color="rgba(255,255,255,0.5)" tracking="0.4em" size={11}>realização</SmallCaps>
        <div style={{ background: "#fbf8f1", padding: "4px 10px", borderRadius: 3 }}>
          <img src="assets/cdl-logo.png" alt="CDL" style={{ height: 26, display: "block" }}/>
        </div>
      </div>
    </div>

    <div style={{
      marginTop: 60, fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 300,
      fontSize: 88, lineHeight: 0.95, letterSpacing: "-0.02em", maxWidth: 1300,
    }}>
      Uma campanha que<br/>
      <span style={{ fontWeight: 800, color: "#e6bf5f" }}>conversa com Aracaju</span> inteira.
    </div>

    <div style={{ marginTop: 80, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }}>
      {[
        { tag: "alcance", n: "650k", l: "impressões orgânicas estimadas" },
        { tag: "social", n: "12 sem.", l: "de campanha contínua nas redes" },
        { tag: "imprensa", n: "20+", l: "veículos parceiros e releases" },
        { tag: "evento", n: "1.200", l: "convidados na cerimônia" },
      ].map(s => (
        <div key={s.l} style={{
          background: "rgba(212,165,55,0.06)", border: "1px solid rgba(212,165,55,0.3)",
          padding: 32, borderRadius: 4, position: "relative",
        }}>
          <SmallCaps color="#d4a537" size={11} tracking="0.4em">{s.tag}</SmallCaps>
          <div style={{
            marginTop: 28, fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 700,
            fontSize: 80, color: "#fbf8f1", lineHeight: 1, letterSpacing: "-0.02em",
          }}>{s.n}</div>
          <div style={{ marginTop: 16, fontSize: 15, color: "rgba(255,255,255,0.78)", lineHeight: 1.45 }}>{s.l}</div>
        </div>
      ))}
    </div>

    <div style={{ marginTop: 80, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32 }}>
      {[
        { l: "Mulheres 25-44", v: 58 },
        { l: "Classes A/B", v: 64 },
        { l: "Aracaju + Grande Aracaju", v: 92 },
      ].map(s => (
        <div key={s.l}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <SmallCaps color="rgba(255,255,255,0.65)" size={11} tracking="0.35em">{s.l}</SmallCaps>
            <div style={{
              fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 700, fontSize: 26, color: "#d4a537",
            }}>{s.v}%</div>
          </div>
          <div style={{ marginTop: 12, height: 3, background: "rgba(255,255,255,0.1)", borderRadius: 2 }}>
            <div style={{ width: `${s.v}%`, height: "100%", background: "#d4a537", borderRadius: 2 }}/>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const Slide4Tiers = () => (
  <div style={{
    width: 1920, height: 1080, position: "relative", overflow: "hidden",
    background: "#f5f1e8", color: "#0a2a5e", fontFamily: "var(--font-sans)", padding: "80px 120px",
  }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <SmallCaps color="#b88a2a" tracking="0.45em" size={13}>03 · cotas</SmallCaps>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <SmallCaps color="rgba(10,42,94,0.5)" tracking="0.4em" size={11}>realização</SmallCaps>
        <img src="assets/cdl-logo.png" alt="CDL" style={{ height: 32, display: "block" }}/>
      </div>
    </div>

    <div style={{
      marginTop: 40, fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 300,
      fontSize: 76, lineHeight: 0.95, letterSpacing: "-0.02em",
    }}>
      Três formas de<br/>
      <span style={{ fontWeight: 800 }}>estar ao nosso lado.</span>
    </div>

    <div style={{ marginTop: 60, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32 }}>
      {[
        {
          tier: "bronze", title: "Apoio", price: "R$ 8.000",
          color: "#b88a2a",
          items: ["Logo no site da votação", "Menção em 4 posts", "Convite p/ 4 pessoas"],
          dark: false,
        },
        {
          tier: "prata", title: "Patrocínio", price: "R$ 18.000",
          color: "#0a2a5e",
          items: ["Logo em todas as peças", "Posts dedicados (8)", "Categoria patrocinada", "Convite p/ 10 pessoas", "Banner no telão"],
          dark: false,
        },
        {
          tier: "ouro", title: "Master", price: "R$ 38.000",
          color: "#0a2a5e",
          items: ["Naming co-brand do prêmio", "Selo em 100% das peças", "3 categorias patrocinadas", "Discurso na cerimônia", "Mesa premium · 20 pessoas", "Pacote de mídia (release + entrevistas)"],
          dark: true, highlight: true,
        },
      ].map((t, i) => (
        <div key={t.tier} style={{
          background: t.dark ? "#0a2a5e" : "#fbf8f1",
          color: t.dark ? "#fbf8f1" : "#0a2a5e",
          padding: 36, borderRadius: 4, position: "relative",
          border: t.highlight ? "2px solid #d4a537" : "1px solid rgba(10,42,94,0.15)",
          boxShadow: t.highlight ? "0 20px 50px rgba(10,42,94,0.2)" : "none",
        }}>
          {t.highlight && (
            <div style={{
              position: "absolute", top: -12, left: 24, background: "#d4a537", color: "#0a2a5e",
              padding: "5px 12px", fontWeight: 700, fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase",
            }}>recomendado</div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <SmallCaps color={t.dark ? "#d4a537" : t.color} tracking="0.4em" size={12}>{t.tier}</SmallCaps>
          </div>
          <div style={{
            marginTop: 18, fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 600,
            fontSize: 56, lineHeight: 1, letterSpacing: "-0.02em",
          }}>{t.title}</div>
          <div style={{
            marginTop: 14, fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 800,
            fontSize: 42, color: t.dark ? "#e6bf5f" : "#0a2a5e",
          }}>{t.price}</div>
          <div style={{ marginTop: 24, height: 1, background: t.dark ? "rgba(212,165,55,0.3)" : "rgba(10,42,94,0.15)" }}/>
          <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 14 }}>
            {t.items.map(it => (
              <div key={it} style={{ display: "flex", gap: 12, alignItems: "flex-start", fontSize: 15, lineHeight: 1.4 }}>
                <span style={{ color: t.dark ? "#d4a537" : "#b88a2a", fontWeight: 700, marginTop: 2 }}>—</span>
                <span style={{ color: t.dark ? "rgba(255,255,255,0.85)" : "rgba(10,42,94,0.85)" }}>{it}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const Slide5Contact = () => (
  <div style={{
    width: 1920, height: 1080, position: "relative", overflow: "hidden",
    background: "linear-gradient(135deg, #061d44 0%, #0a2a5e 50%, #04122e 100%)",
    color: "#fbf8f1", fontFamily: "var(--font-sans)",
  }}>
    <div className="mda-rays"/>
    <div className="mda-grain"/>
    <div style={{
      position: "absolute", inset: 0,
      background: "radial-gradient(ellipse 50% 60% at 50% 60%, rgba(212,165,55,0.18), transparent 60%)",
    }}/>

    <div style={{
      position: "absolute", top: 80, left: 0, right: 0, display: "flex", justifyContent: "center",
    }}>
      <LaurelWreath size={140} color="#d4a537"/>
    </div>

    <div style={{
      position: "absolute", top: 280, left: 0, right: 0,
      display: "flex", flexDirection: "column", alignItems: "center", gap: 24, padding: "0 120px",
    }}>
      <SmallCaps color="#d4a537" tracking="0.6em" size={15}>vamos conversar?</SmallCaps>
      <div style={{
        fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 300,
        fontSize: 86, textAlign: "center", lineHeight: 1, letterSpacing: "-0.02em", maxWidth: 1300,
      }}>
        Coloque sua marca onde<br/>
        <span style={{ fontWeight: 800, color: "#e6bf5f" }}>Aracaju já está olhando.</span>
      </div>
    </div>

    <div style={{
      position: "absolute", bottom: 220, left: 0, right: 0,
      display: "flex", justifyContent: "center", gap: 80,
    }}>
      {[
        { l: "comercial", v: "Mariana Costa" },
        { l: "telefone", v: "(79) 3211-0000" },
        { l: "e-mail", v: "patrocinio@cdlaju.com.br" },
      ].map(c => (
        <div key={c.l} style={{ textAlign: "center" }}>
          <SmallCaps color="rgba(255,255,255,0.5)" size={11} tracking="0.4em">{c.l}</SmallCaps>
          <div style={{
            marginTop: 12, fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 26,
            color: "#fbf8f1",
          }}>{c.v}</div>
        </div>
      ))}
    </div>

    <div style={{
      position: "absolute", bottom: 80, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 18,
    }}>
      <Divider width={50} color="#d4a537"/>
      <Realizacao variant="light" size="sm"/>
      <SmallCaps color="rgba(255,255,255,0.55)" size={11} tracking="0.4em">34ª edição · 2026</SmallCaps>
    </div>
  </div>
);

Object.assign(window, { Slide1Cover, Slide2WhatIs, Slide3Audience, Slide4Tiers, Slide5Contact });
