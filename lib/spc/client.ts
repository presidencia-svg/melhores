import axios, { AxiosError } from "axios";
import { onlyDigits, hashCpf } from "@/lib/cpf";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

type SpcConsultaResponse = {
  result?: {
    return_object?: {
      resultado?: {
        consumidor?: {
          consumidorPessoaFisica?: {
            nome?: string;
            dataNascimento?: number;
          };
        };
      } | null;
    };
    error?: string | boolean;
    message?: string;
  };
};

export type SpcLookupResult = {
  ok: true;
  nome: string;
  cached: boolean;
} | {
  ok: false;
  motivo: "nao_encontrado" | "erro_externo" | "credenciais" | "rate_limit";
  detalhe?: string;
};

const ENDPOINTS = {
  homologacao: process.env.SPC_API_URL_HOMOLOG ?? "https://treinamento.spcbrasil.com.br/spcconsulta/recurso/consulta/padrao",
  producao: process.env.SPC_API_URL ?? "https://api.spcbrasil.com.br/spcconsulta/recurso/consulta/padrao",
};

export async function consultarCpfSpc(cpf: string): Promise<SpcLookupResult> {
  const numeros = onlyDigits(cpf);
  if (numeros.length !== 11) return { ok: false, motivo: "nao_encontrado", detalhe: "CPF inválido" };

  // Modo MOCK — para testes quando SPC indisponível
  if (process.env.SPC_MOCK === "true") {
    const nome = `VOTANTE TESTE ${numeros.slice(-4)}`;
    return { ok: true, nome, cached: false };
  }

  const supabase = createSupabaseAdminClient();
  const cpfHash = hashCpf(numeros);

  // 1) Cache
  const { data: cached } = await supabase
    .from("spc_cache")
    .select("nome")
    .eq("cpf_hash", cpfHash)
    .maybeSingle();

  if (cached?.nome) {
    return { ok: true, nome: cached.nome, cached: true };
  }

  // 2) Chamada SPC
  const ambiente = (process.env.SPC_AMBIENTE ?? "homologacao") as "homologacao" | "producao";
  const url = ambiente === "producao" ? ENDPOINTS.producao : ENDPOINTS.homologacao;
  const codigoProduto = process.env.SPC_CODIGO_PRODUTO ?? "325";
  const user = process.env.SPC_USER;
  const password = process.env.SPC_PASSWORD;

  if (!user || !password) {
    return { ok: false, motivo: "credenciais", detalhe: "SPC_USER/SPC_PASSWORD não configurados" };
  }

  try {
    const { data } = await axios.post<SpcConsultaResponse>(
      url,
      {
        codigoProduto,
        tipoConsumidor: "F",
        documentoConsumidor: numeros,
        codigoInsumoOpcional: [],
      },
      {
        auth: { username: user, password },
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        timeout: 15000,
      }
    );

    // Erro estruturado da SPC (mesmo com HTTP 200/500)
    if (data?.result?.error === "true" || data?.result?.error === true) {
      const msg = data?.result?.message ?? "Erro SPC";
      console.error("[SPC] erro retornado:", msg);
      return { ok: false, motivo: "erro_externo", detalhe: msg };
    }

    const pf = data?.result?.return_object?.resultado?.consumidor?.consumidorPessoaFisica;
    const nome = pf?.nome?.trim();
    if (!nome) {
      return { ok: false, motivo: "nao_encontrado", detalhe: "CPF não localizado no SPC" };
    }

    await supabase.from("spc_cache").upsert({
      cpf_hash: cpfHash,
      nome,
      data_nascimento: pf?.dataNascimento ? new Date(pf.dataNascimento).toISOString().slice(0, 10) : null,
      raw_response: data as unknown as Record<string, unknown>,
    });

    return { ok: true, nome, cached: false };
  } catch (err) {
    const ax = err as AxiosError<SpcConsultaResponse>;
    if (ax.response?.status === 401 || ax.response?.status === 403) {
      return { ok: false, motivo: "credenciais", detalhe: "Auth SPC inválida" };
    }
    if (ax.response?.status === 429) {
      return { ok: false, motivo: "rate_limit" };
    }
    // Mensagem estruturada da SPC mesmo em HTTP 500
    const spcMessage = ax.response?.data?.result?.message;
    if (spcMessage) {
      console.error("[SPC] erro:", spcMessage);
      return { ok: false, motivo: "erro_externo", detalhe: spcMessage };
    }
    return { ok: false, motivo: "erro_externo", detalhe: ax.message };
  }
}
