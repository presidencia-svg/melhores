"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          size?: "normal" | "compact" | "invisible";
        }
      ) => string;
      reset: (id?: string) => void;
      remove: (id?: string) => void;
    };
    onTurnstileReady?: () => void;
    __turnstileReset?: () => void;
  }
}

const SCRIPT_ID = "cf-turnstile-script";

export function Turnstile({
  onToken,
  onExpired,
}: {
  onToken: (token: string) => void;
  onExpired?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!sitekey || !containerRef.current) return;

    const render = () => {
      if (!window.turnstile || !containerRef.current) return;
      if (widgetIdRef.current) return;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey,
        callback: onToken,
        "expired-callback": () => onExpired?.(),
        "error-callback": () => onExpired?.(),
        size: "normal",
        theme: "light",
      });
    };

    // Expose reset globally so the form can call it after a failed submit
    window.__turnstileReset = () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current);
        onExpired?.();
      }
    };

    if (window.turnstile) {
      render();
    } else if (!document.getElementById(SCRIPT_ID)) {
      const script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileReady";
      script.async = true;
      script.defer = true;
      window.onTurnstileReady = render;
      document.head.appendChild(script);
    } else {
      window.onTurnstileReady = render;
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // ignore
        }
        widgetIdRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sitekey]);

  if (!sitekey) {
    // Sem chave configurada — não renderiza widget. O servidor faz o gate.
    return null;
  }

  return <div ref={containerRef} className="my-2" />;
}
