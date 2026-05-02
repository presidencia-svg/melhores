"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";

const STORAGE_KEY = "safari-aviso-dispensado-v1";

// Detecta Safari "puro" (no iOS ou macOS) — exclui Chrome, Firefox, Edge
// e variantes que usam o WebKit mas se identificam como outro navegador.
function ehSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const vendor = navigator.vendor || "";
  // Apple vendor + Safari no UA + sem CriOS/FxiOS/EdgiOS (variantes Chrome/FF/Edge no iOS)
  const apple = vendor.includes("Apple");
  const safariUA = /Safari\//.test(ua) && !/Chrome\/|Chromium\/|Edg\//.test(ua);
  const naoEhVarianteIos = !/CriOS|FxiOS|EdgiOS/.test(ua);
  return apple && safariUA && naoEhVarianteIos;
}

export function SafariAviso() {
  const [mostrar, setMostrar] = useState(false);

  useEffect(() => {
    if (!ehSafari()) return;
    try {
      if (localStorage.getItem(STORAGE_KEY) === "1") return;
    } catch {
      // localStorage bloqueado — mostra mesmo assim
    }
    setMostrar(true);
  }, []);

  function dispensar() {
    setMostrar(false);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignora
    }
  }

  if (!mostrar) return null;

  return (
    <div className="bg-amber-500 text-navy-800 border-b-2 border-amber-600 px-4 py-3 text-sm">
      <div className="mx-auto max-w-4xl flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
        <div className="flex-1 leading-snug">
          <strong>Atenção:</strong> esta votação funciona melhor no{" "}
          <strong>Google Chrome</strong>. No Safari pode dar problema na hora de
          enviar a selfie ou validar o CPF. Se travar, abre essa mesma página no{" "}
          <a
            href="https://www.google.com/chrome/"
            target="_blank"
            rel="noreferrer"
            className="underline font-semibold hover:text-navy-900"
          >
            Chrome
          </a>{" "}
          e tenta de novo.
        </div>
        <button
          onClick={dispensar}
          className="shrink-0 hover:bg-amber-600/30 rounded p-1 transition-colors"
          aria-label="Fechar aviso"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
