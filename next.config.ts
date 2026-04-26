import type { NextConfig } from "next";

const securityHeaders = [
  // Bloqueia que o site seja embedado em iframe (clickjacking)
  { key: "X-Frame-Options", value: "DENY" },
  // Bloqueia MIME-sniffing (XSS via tipo errado)
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Não envia URL completa em cross-origin
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Permissões de APIs sensíveis
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(), geolocation=(), payment=(), usb=()",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
