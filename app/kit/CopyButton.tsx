"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  function handleClick() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-2 text-sm font-semibold text-cdl-blue hover:text-cdl-blue-dark"
    >
      {copied ? <Check className="w-4 h-4 text-cdl-green" /> : <Copy className="w-4 h-4" />}
      {copied ? "Copiado!" : "Copiar texto"}
    </button>
  );
}
