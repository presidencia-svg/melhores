"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { UserPlus, UserX, ShieldCheck, Loader2 } from "lucide-react";

type Modo = "livre" | "aprovacao" | "desligadas";

const OPCOES: {
  modo: Modo;
  titulo: string;
  desc: string;
  cor: string;
  icone: React.ReactNode;
}[] = [
  {
    modo: "livre",
    titulo: "Aceitar livremente",
    desc: "O votante sugere e o candidato já entra na votação automaticamente. Default — mais rápido pra crescer a lista.",
    cor: "border-green-600 bg-green-50 text-green-900",
    icone: <UserPlus className="w-4 h-4" />,
  },
  {
    modo: "aprovacao",
    titulo: "Aceitar com aprovação",
    desc: "O votante sugere e o candidato fica pendente. Só aparece na votação quando o admin aprovar em /admin/sugestoes.",
    cor: "border-amber-600 bg-amber-50 text-amber-900",
    icone: <ShieldCheck className="w-4 h-4" />,
  },
  {
    modo: "desligadas",
    titulo: "Desligado",
    desc: "Botão 'Sugerir' some da tela de votação. O votante só escolhe entre candidatos já cadastrados.",
    cor: "border-red-600 bg-red-50 text-red-900",
    icone: <UserX className="w-4 h-4" />,
  },
];

export function SugestoesPublicasCard() {
  const [modo, setModo] = useState<Modo | null>(null);
  const [salvando, setSalvando] = useState<Modo | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/sugestoes-publicas", {
        cache: "no-store",
      });
      if (res.ok) {
        const d = (await res.json()) as { modo: Modo };
        setModo(d.modo);
      }
    } catch {
      // ignora
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function escolher(novoModo: Modo) {
    if (modo === novoModo || salvando) return;
    setSalvando(novoModo);
    setErro(null);
    try {
      const res = await fetch("/api/admin/sugestoes-publicas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modo: novoModo }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error ?? "Falha ao salvar");
      } else {
        setModo(data.modo);
      }
    } catch {
      setErro("Erro de conexão");
    } finally {
      setSalvando(null);
    }
  }

  if (modo === null) return null;

  return (
    <Card className="mb-6">
      <CardContent>
        <header className="mb-4">
          <h2 className="font-display-bold text-navy-800 text-lg leading-tight">
            Sugestão pública de candidato
          </h2>
          <p className="text-xs text-muted mt-1 max-w-2xl">
            Como o sistema trata sugestões de candidatos novos feitas pelos
            votantes durante a votação.
          </p>
        </header>

        <div className="grid sm:grid-cols-3 gap-3">
          {OPCOES.map((o) => {
            const ativo = modo === o.modo;
            const carregando = salvando === o.modo;
            return (
              <button
                key={o.modo}
                type="button"
                onClick={() => escolher(o.modo)}
                disabled={salvando !== null}
                className={`text-left rounded-lg border-2 p-4 transition-all relative ${
                  ativo
                    ? o.cor + " shadow-sm"
                    : "border-border bg-cream-100/30 text-navy-800/70 hover:border-navy-800/30 hover:bg-cream-100/60"
                } ${salvando !== null && !ativo ? "opacity-40" : ""}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {carregando ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    o.icone
                  )}
                  <span className="font-display-bold text-sm">{o.titulo}</span>
                  {ativo && (
                    <span className="ml-auto text-[10px] font-bold uppercase tracking-wider">
                      ativo
                    </span>
                  )}
                </div>
                <p className="text-xs leading-relaxed opacity-80">{o.desc}</p>
              </button>
            );
          })}
        </div>

        {erro && (
          <p className="mt-3 text-sm text-red-600 text-center">{erro}</p>
        )}
      </CardContent>
    </Card>
  );
}
