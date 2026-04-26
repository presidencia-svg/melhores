// Reusable "Realização" lockup with CDL logo

const Realizacao = ({
  variant = "light",     // "light" (white text on dark bg) | "dark" (navy text on light bg)
  size = "md",           // "sm" | "md" | "lg"
  layout = "horizontal", // "horizontal" | "stacked"
}) => {
  const sizes = {
    sm: { logo: 28, label: 9, gap: 10, tracking: "0.4em" },
    md: { logo: 40, label: 10, gap: 12, tracking: "0.4em" },
    lg: { logo: 56, label: 12, gap: 16, tracking: "0.4em" },
  }[size];

  const labelColor = variant === "light"
    ? "rgba(255,255,255,0.55)"
    : "rgba(10,42,94,0.55)";

  const dividerColor = variant === "light"
    ? "rgba(255,255,255,0.2)"
    : "rgba(10,42,94,0.2)";

  // CDL logo is on a transparent background. For dark/navy backgrounds,
  // we put it on a small cream chip so the dark blue logo stays legible.
  const logoChip = variant === "light";

  if (layout === "stacked") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: sizes.gap }}>
        <div style={{
          fontFamily: "var(--font-sans)", textTransform: "uppercase",
          letterSpacing: sizes.tracking, fontSize: sizes.label, fontWeight: 600,
          color: labelColor,
        }}>realização</div>
        <div style={{
          background: logoChip ? "#fbf8f1" : "transparent",
          padding: logoChip ? "8px 14px" : 0, borderRadius: 4,
          display: "flex", alignItems: "center",
        }}>
          <img src="assets/cdl-logo.png" alt="CDL Aracaju"
               style={{ height: sizes.logo, display: "block" }}/>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: sizes.gap }}>
      <div style={{
        fontFamily: "var(--font-sans)", textTransform: "uppercase",
        letterSpacing: sizes.tracking, fontSize: sizes.label, fontWeight: 600,
        color: labelColor,
      }}>realização</div>
      <div style={{ width: 1, height: sizes.logo * 0.8, background: dividerColor }}/>
      <div style={{
        background: logoChip ? "#fbf8f1" : "transparent",
        padding: logoChip ? "6px 12px" : 0, borderRadius: 4,
        display: "flex", alignItems: "center",
      }}>
        <img src="assets/cdl-logo.png" alt="CDL Aracaju"
             style={{ height: sizes.logo, display: "block" }}/>
      </div>
    </div>
  );
};

Object.assign(window, { Realizacao });
