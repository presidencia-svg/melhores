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
          <path d="M14 8 L14 22 C14 28 18 30 24 30 C30 30 34 28 34 22 L34 8 Z" />
          <path d="M12 10 C7 10 6 13 6 16 C6 19 8 21 13 21 L13 17 C10 17 10 16 10 15 C10 14 11 13 13 13 Z" />
          <path d="M36 10 C41 10 42 13 42 16 C42 19 40 21 35 21 L35 17 C38 17 38 16 38 15 C38 14 37 13 35 13 Z" />
          <rect x="22" y="29" width="4" height="6" />
          <rect x="14" y="35" width="20" height="5" rx="1" />
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
