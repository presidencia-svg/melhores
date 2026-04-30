"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Zap, Clock } from "lucide-react";

type Estado = {
  ligado: boolean;
  envios: { hora: number; dia: number; auto_dia: number };
};

export function AutoIncentivoSection() {
  const [estado, setEstado] = useState<Estado | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/auto-incentivo", { cache: "no-store" });
      if (res.ok) setEstado(await res.json());
    } catch {
      // ignora
    }
  }, []);

  useEffect(() => {
    carregar();
    const id = setInterval(carregar, 30_000);
    return () => clearInterval(id);
  }, [carregar]);

  async function alternar() {
    if (!estado || salvando) return;
    setSalvando(true);
    setErro(null);
    try {
      const res = await fetch("/api/admin/auto-incentivo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ligado: !estado.ligado }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error ?? "Falha ao salvar");
      } else {
        await carregar();
      }
    } catch {
      setErro("Erro de conexão");
    } finally {
      setSalvando(false);
    }
  }

  if (!estado) {
    return (
      <Card className="mt-6">
        <CardContent>
          <p className="text-sm text-muted">Carregando…</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardContent>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                estado.ligado ? "bg-green-600/15" : "bg-gray-200"
              }`}
            >
              <Zap
                className={`w-5 h-5 ${estado.ligado ? "text-green-700" : "text-gray-500"}`}
              />
            </div>
            <div>
              <h2 className="font-display-bold text-navy-800 text-lg leading-tight">
                Auto-incentivo em empates
              </h2>
              <p className="text-xs text-muted mt-1 max-w-md">
                A cada 10min, o sistema verifica subcategorias empatadas e dispara
                WhatsApp pra quem votou nos dois lados — pra ajudar a desempatar.
                Cooldown de 24h cross-campaign (não envia se já mandaram parcial
                ou outro incentivo nas últimas 24h), janela 8h–21h, max 200/h e 1.000/dia.
              </p>
            </div>
          </div>
          <button
            onClick={alternar}
            disabled={salvando}
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
              estado.ligado ? "bg-green-600" : "bg-gray-300"
            } ${salvando ? "opacity-50" : ""}`}
            aria-label={estado.ligado ? "Desligar" : "Ligar"}
          >
            <span
              className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                estado.ligado ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-md bg-cream-100 py-2">
            <p className="kicker text-muted" style={{ fontSize: 9 }}>
              últ. hora
            </p>
            <p className="font-display-bold text-navy-800 text-lg">
              {estado.envios.hora}
            </p>
            <p className="text-[10px] text-muted">de 200</p>
          </div>
          <div className="rounded-md bg-cream-100 py-2">
            <p className="kicker text-muted" style={{ fontSize: 9 }}>
              últ. 24h
            </p>
            <p className="font-display-bold text-navy-800 text-lg">
              {estado.envios.dia}
            </p>
            <p className="text-[10px] text-muted">de 1000</p>
          </div>
          <div className="rounded-md bg-cream-100 py-2">
            <p className="kicker text-muted" style={{ fontSize: 9 }}>
              auto hoje
            </p>
            <p className="font-display-bold text-navy-800 text-lg">
              {estado.envios.auto_dia}
            </p>
            <p className="text-[10px] text-muted flex items-center justify-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              empates
            </p>
          </div>
        </div>

        {erro && (
          <p className="mt-3 text-sm text-red-600 text-center">{erro}</p>
        )}
      </CardContent>
    </Card>
  );
}
