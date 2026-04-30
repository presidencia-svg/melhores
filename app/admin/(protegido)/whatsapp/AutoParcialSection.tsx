"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Send, Clock, Check } from "lucide-react";

type Estado = {
  ligado: boolean;
  cap_dia: number;
  envios: { hora: number; dia: number };
  fila: { total: number; ja_receberam: number; na_fila: number; enviadas_hoje: number };
};

export function AutoParcialSection() {
  const [estado, setEstado] = useState<Estado | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [capInput, setCapInput] = useState<string>("");
  const [capSalvo, setCapSalvo] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/auto-parcial", { cache: "no-store" });
      if (res.ok) {
        const d = (await res.json()) as Estado;
        setEstado(d);
        setCapInput((prev) => (prev === "" ? String(d.cap_dia) : prev));
      }
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
      const res = await fetch("/api/admin/auto-parcial", {
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

  async function salvarCap() {
    if (!estado || salvando) return;
    const n = parseInt(capInput, 10);
    if (!Number.isFinite(n) || n < 0 || n > 10000) {
      setErro("Cap inválido (0–10000)");
      setCapInput(String(estado.cap_dia));
      return;
    }
    if (n === estado.cap_dia) return; // sem mudanca
    setSalvando(true);
    setErro(null);
    try {
      const res = await fetch("/api/admin/auto-parcial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cap_dia: n }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error ?? "Falha ao salvar");
        setCapInput(String(estado.cap_dia));
      } else {
        setCapSalvo(true);
        setTimeout(() => setCapSalvo(false), 2000);
        await carregar();
      }
    } catch {
      setErro("Erro de conexão");
      setCapInput(String(estado.cap_dia));
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
              <Send
                className={`w-5 h-5 ${estado.ligado ? "text-green-700" : "text-gray-500"}`}
              />
            </div>
            <div>
              <h2 className="font-display-bold text-navy-800 text-lg leading-tight">
                Auto-parcial personalizada
              </h2>
              <p className="text-xs text-muted mt-1 max-w-md">
                A cada 10min envia parcial personalizada pra quem já votou e tem
                ao menos 1 sub acirrada (≤ 30% diff). Janela 8h–21h Nordeste,
                cap 200/h, 1 envio por pessoa (lifetime), espera 1h após o
                último voto.
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

        <div className="mt-4 flex items-center gap-3 text-sm flex-wrap">
          <label htmlFor="cap-dia" className="text-navy-800 font-medium">
            Limite diário:
          </label>
          <input
            id="cap-dia"
            type="number"
            min={0}
            max={10000}
            step={50}
            value={capInput}
            onChange={(e) => setCapInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                salvarCap();
              }
            }}
            disabled={salvando}
            className="w-24 rounded border border-[rgba(10,42,94,0.2)] bg-white px-2 py-1 text-sm font-mono text-navy-800 focus:border-cdl-blue focus:outline-none focus:ring-1 focus:ring-cdl-blue disabled:opacity-50"
          />
          <span className="text-xs text-muted">mensagens/dia</span>
          <button
            onClick={salvarCap}
            disabled={salvando || parseInt(capInput, 10) === estado.cap_dia}
            className="rounded bg-cdl-blue text-white px-3 py-1 text-xs font-medium hover:bg-cdl-blue-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {salvando ? "Salvando…" : "Salvar"}
          </button>
          {capSalvo && (
            <span className="inline-flex items-center gap-1 text-xs text-green-700 font-medium">
              <Check className="w-3 h-3" />
              salvo
            </span>
          )}
        </div>

        <div className="mt-4 grid grid-cols-4 gap-3 text-center">
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
            <p className="text-[10px] text-muted">
              de {estado.cap_dia.toLocaleString("pt-BR")}
            </p>
          </div>
          <div className="rounded-md bg-cream-100 py-2">
            <p className="kicker text-muted" style={{ fontSize: 9 }}>
              hoje
            </p>
            <p className="font-display-bold text-navy-800 text-lg">
              {estado.fila.enviadas_hoje}
            </p>
            <p className="text-[10px] text-muted flex items-center justify-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              enviadas
            </p>
          </div>
          <div className="rounded-md bg-cream-100 py-2">
            <p className="kicker text-muted" style={{ fontSize: 9 }}>
              fila
            </p>
            <p className="font-display-bold text-navy-800 text-lg">
              {estado.fila.na_fila}
            </p>
            <p className="text-[10px] text-muted">pendentes</p>
          </div>
        </div>

        {erro && (
          <p className="mt-3 text-sm text-red-600 text-center">{erro}</p>
        )}
      </CardContent>
    </Card>
  );
}
