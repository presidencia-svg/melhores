// Identidade visual board (logo lockup, paleta, tipografia) — 1600x1100

const IdentidadeVisual = () => (
  <div style={{
    width: 1600, height: 1100, position: "relative", overflow: "hidden",
    background: "#fbf8f1", color: "#0a2a5e", fontFamily: "var(--font-sans)",
    padding: "60px 70px",
  }}>
    {/* header */}
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div>
        <SmallCaps color="#b88a2a" tracking="0.4em" size={12}>identidade visual · 2026</SmallCaps>
        <div style={{
          marginTop: 16, fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 300,
          fontSize: 64, letterSpacing: "-0.02em", lineHeight: 0.95,
        }}>
          Melhores <span style={{ fontWeight: 800 }}>do ano</span>
        </div>
      </div>
      <img src="assets/cdl-logo.png" alt="CDL" style={{ height: 64 }}/>
    </div>

    <div style={{ marginTop: 40, height: 1, background: "rgba(10,42,94,0.15)" }}/>

    {/* main grid */}
    <div style={{ marginTop: 36, display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 50 }}>
      {/* left column: lockup + paleta */}
      <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
        {/* lockup */}
        <div>
          <SmallCaps color="rgba(10,42,94,0.55)" size={11} tracking="0.4em">a · lockup principal</SmallCaps>
          <div style={{
            marginTop: 18, height: 280, background: "linear-gradient(135deg, #0a2a5e 0%, #061d44 100%)",
            display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", borderRadius: 4,
          }}>
            <div className="mda-grain"/>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, color: "#fbf8f1" }}>
              <SmallCaps color="#d4a537" size={10} tracking="0.5em">cdl aracaju · 2026</SmallCaps>
              <div style={{ marginTop: 8, fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 300, fontSize: 38 }}>Os melhores</div>
              <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 800, fontSize: 70, color: "#e6bf5f", lineHeight: 0.9 }}>do ano</div>
              <div style={{ marginTop: 4 }}><Divider width={28} color="#d4a537"/></div>
            </div>
          </div>
        </div>

        {/* paleta */}
        <div>
          <SmallCaps color="rgba(10,42,94,0.55)" size={11} tracking="0.4em">b · paleta</SmallCaps>
          <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
            {[
              { c: "#061d44", n: "Navy 900", h: "#061d44", on: "#fbf8f1" },
              { c: "#0a2a5e", n: "Navy 800", h: "#0a2a5e", on: "#fbf8f1" },
              { c: "#d4a537", n: "Gold 500", h: "#d4a537", on: "#0a2a5e" },
              { c: "#0f8a3f", n: "Green 600", h: "#0f8a3f", on: "#fbf8f1" },
              { c: "#f5f1e8", n: "Cream", h: "#f5f1e8", on: "#0a2a5e" },
            ].map(s => (
              <div key={s.n} style={{
                background: s.c, color: s.on, height: 110, padding: 12,
                display: "flex", flexDirection: "column", justifyContent: "space-between",
                border: s.c === "#f5f1e8" ? "1px solid rgba(10,42,94,0.15)" : "none",
                borderRadius: 2,
              }}>
                <SmallCaps color={s.on} size={9} tracking="0.3em">{s.n}</SmallCaps>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, opacity: 0.8 }}>{s.h}</div>
              </div>
            ))}
          </div>
        </div>

        {/* motivos / marcas */}
        <div>
          <SmallCaps color="rgba(10,42,94,0.55)" size={11} tracking="0.4em">c · marcas e ornamentos</SmallCaps>
          <div style={{ marginTop: 18, display: "flex", gap: 18 }}>
            {[
              <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#0a2a5e", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <TrophyMark size={40} color="#d4a537"/>
              </div>,
              <div style={{ width: 80, height: 80, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <LaurelWreath size={70} color="#0a2a5e"/>
              </div>,
              <div style={{ width: 80, height: 80, background: "#d4a537", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 800, fontSize: 30, color: "#0a2a5e" }}>2026</div>
              </div>,
              <div style={{ width: 80, height: 80, border: "1.5px solid #0a2a5e", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Divider width={20} color="#0a2a5e"/>
              </div>,
            ].map((m, i) => <div key={i}>{m}</div>)}
          </div>
        </div>
      </div>

      {/* right column: tipografia */}
      <div>
        <SmallCaps color="rgba(10,42,94,0.55)" size={11} tracking="0.4em">d · tipografia</SmallCaps>

        {/* display */}
        <div style={{ marginTop: 18, padding: 24, border: "1px solid rgba(10,42,94,0.15)", borderRadius: 2 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <SmallCaps color="#b88a2a" size={10} tracking="0.4em">display · fraunces italic</SmallCaps>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "rgba(10,42,94,0.6)" }}>weights 300, 700, 900</span>
          </div>
          <div style={{
            marginTop: 16, fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 300,
            fontSize: 60, lineHeight: 0.95, letterSpacing: "-0.02em",
          }}>Os melhores</div>
          <div style={{
            fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 800,
            fontSize: 80, lineHeight: 0.9, color: "#0a2a5e", letterSpacing: "-0.03em",
          }}>do ano</div>
          <div style={{ marginTop: 10, display: "flex", gap: 14, alignItems: "baseline" }}>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontStyle: "italic", fontSize: 28, color: "#d4a537" }}>2026</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(10,42,94,0.6)" }}>Aa Bb Cc Çç 0123 — uso para títulos, numerais e assinatura</span>
          </div>
        </div>

        {/* sans */}
        <div style={{ marginTop: 16, padding: 24, border: "1px solid rgba(10,42,94,0.15)", borderRadius: 2 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <SmallCaps color="#b88a2a" size={10} tracking="0.4em">sans · sora</SmallCaps>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "rgba(10,42,94,0.6)" }}>weights 400, 600, 700</span>
          </div>
          <div style={{ marginTop: 12, fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14, letterSpacing: "0.4em", textTransform: "uppercase", color: "#0a2a5e" }}>
            kicker · small caps
          </div>
          <div style={{ marginTop: 8, fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 22, color: "#0a2a5e" }}>
            Subtítulo: você decide os destaques.
          </div>
          <div style={{ marginTop: 6, fontFamily: "var(--font-sans)", fontWeight: 400, fontSize: 14, color: "rgba(10,42,94,0.78)", lineHeight: 1.55 }}>
            Texto corrido. A CDL Aracaju ouve a cidade há 34 anos e premia os negócios que marcam a vida de quem mora aqui — em mais de 88 categorias.
          </div>
        </div>

        {/* mono */}
        <div style={{ marginTop: 16, padding: 20, border: "1px solid rgba(10,42,94,0.15)", borderRadius: 2 }}>
          <SmallCaps color="#b88a2a" size={10} tracking="0.4em">mono · jetbrains mono</SmallCaps>
          <div style={{ marginTop: 10, fontFamily: "var(--font-mono)", fontSize: 14, color: "#0a2a5e" }}>
            votar.cdlaju.com.br
          </div>
          <div style={{ marginTop: 4, fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(10,42,94,0.55)" }}>
            uso · URLs, dados e detalhes funcionais
          </div>
        </div>

        {/* princípios */}
        <div style={{ marginTop: 16, padding: 20, background: "#0a2a5e", color: "#fbf8f1", borderRadius: 2 }}>
          <SmallCaps color="#d4a537" size={10} tracking="0.4em">e · princípios</SmallCaps>
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8, fontSize: 13, lineHeight: 1.5 }}>
            <div>— Itálico do display carrega a cerimônia.</div>
            <div>— Ouro só em pontos de honra: numerais, palavra-chave, CTAs.</div>
            <div>— Verde da marca CDL aparece em momentos de celebração ("eu votei").</div>
            <div>— Composição respira: muito branco/navy ao redor do conteúdo.</div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

Object.assign(window, { IdentidadeVisual });
