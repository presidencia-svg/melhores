import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #142D5F 0%, #1B3A7A 50%, #2D5BAE 100%)",
        }}
      >
        <svg width="100" height="100" viewBox="0 0 48 48" fill="#FFD700" style={{ marginBottom: 8 }}>
          <path d="M24 2l5.5 13.5L44 17l-11 9.5L36 41l-12-7.5L12 41l3-14.5L4 17l14.5-1.5L24 2z" />
        </svg>
        <div
          style={{
            display: "flex",
            color: "white",
            fontSize: 18,
            fontWeight: 800,
            letterSpacing: 2,
          }}
        >
          MELHORES
        </div>
        <div
          style={{
            display: "flex",
            color: "#00A859",
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          CDL ARACAJU
        </div>
      </div>
    ),
    { ...size }
  );
}
