"use client";

import { useState } from "react";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Eye,
  Users,
  Camera,
  AlertTriangle,
} from "lucide-react";

type Resultado =
  | {
      ok: true;
      configurado: true;
      conta: {
        username: string | null;
        nome: string | null;
        foto: string | null;
        seguidores: number | null;
        posts: number | null;
      };
    }
  | {
      ok: false;
      configurado: boolean;
      motivo: string;
      codigo_fb?: number | null;
      fbtrace_id?: string | null;
    };

function fmt(n: number | null): string {
  return n == null ? "—" : n.toLocaleString("pt-BR");
}

export function TesteInstagramBotao() {
  const [carregando, setCarregando] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);

  async function testar() {
    setCarregando(true);
    setResultado(null);
    try {
      const res = await fetch("/api/admin/instagram/teste");
      const data = (await res.json()) as Resultado;
      setResultado(data);
    } catch (e) {
      setResultado({
        ok: false,
        configurado: true,
        motivo: e instanceof Error ? e.message : "Falha de rede",
      });
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={testar}
        disabled={carregando}
        className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-md bg-cdl-blue text-white font-semibold hover:bg-cdl-blue/90 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {carregando ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Consultando Meta API…
          </>
        ) : (
          <>
            <Eye className="w-4 h-4" /> Validar conexão
          </>
        )}
      </button>

      {resultado?.ok && (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-4">
          <div className="flex items-center gap-2 text-emerald-800 font-semibold mb-3">
            <CheckCircle2 className="w-5 h-5" />
            Integração funcionando
          </div>
          <div className="flex items-start gap-3">
            {resultado.conta.foto && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={resultado.conta.foto}
                alt=""
                className="w-12 h-12 rounded-full shrink-0"
              />
            )}
            <div className="flex-1 text-sm text-emerald-900">
              <p className="font-display-bold">
                @{resultado.conta.username ?? "—"}
              </p>
              {resultado.conta.nome && (
                <p className="text-xs opacity-80">{resultado.conta.nome}</p>
              )}
              <div className="flex gap-4 mt-2 text-xs">
                <span className="inline-flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {fmt(resultado.conta.seguidores)} seguidores
                </span>
                <span className="inline-flex items-center gap-1">
                  <Camera className="w-3 h-3" />
                  {fmt(resultado.conta.posts)} posts
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {resultado && !resultado.ok && !resultado.configurado && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="flex items-center gap-2 font-semibold mb-1">
            <AlertTriangle className="w-5 h-5" />
            Não configurado
          </div>
          <p>{resultado.motivo}</p>
          <p className="text-xs mt-2 opacity-80">
            Configure as variáveis na Vercel: INSTAGRAM_BUSINESS_ACCOUNT_ID e
            INSTAGRAM_PAGE_ACCESS_TOKEN.
          </p>
        </div>
      )}

      {resultado && !resultado.ok && resultado.configurado && (
        <div className="rounded-lg border border-rose-300 bg-rose-50 p-4 text-sm text-rose-900">
          <div className="flex items-center gap-2 font-semibold mb-1">
            <XCircle className="w-5 h-5" />
            Falha na conexão
          </div>
          <p>{resultado.motivo}</p>
          {resultado.codigo_fb != null && (
            <p className="text-xs mt-2 font-mono opacity-80">
              código FB: {resultado.codigo_fb}
              {resultado.fbtrace_id && ` · trace: ${resultado.fbtrace_id}`}
            </p>
          )}
          <p className="text-xs mt-2 opacity-80">
            Provável: token expirado, conta IG desvinculada da Page, ou
            permissão instagram_basic ausente.
          </p>
        </div>
      )}
    </div>
  );
}
