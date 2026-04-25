import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1B3A7A 0%, #2D5BAE 100%)",
          borderRadius: 6,
        }}
      >
        <svg width="22" height="22" viewBox="0 0 48 48" fill="#FFD700">
          <path d="M24 2l5.5 13.5L44 17l-11 9.5L36 41l-12-7.5L12 41l3-14.5L4 17l14.5-1.5L24 2z" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
