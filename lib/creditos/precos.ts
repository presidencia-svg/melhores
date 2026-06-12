// Tabela de precos centralizada — em arquivo separado pra ser
// importavel tanto de Server Components quanto de Client Components
// (lib/creditos/index.ts puxa createSupabaseAdminClient, que depende
// de next/headers e nao roda no client).
//
// Modelo: cobra POR VOTANTE (1x no cadastro), nao por voto. Confirmacao
// WhatsApp (OTP) e' debitada separado a cada disparo. Marketing tambem.

export const PRECOS = {
  voto_minimo: 20,             // R$ 0,20 — votante: CPF + selfie sem SPC
  voto_spc: 25,                // R$ 0,25 — votante: CPF + selfie + SPC Brasil
  whatsapp_confirmacao: 25,    // R$ 0,25 — cada envio de OTP no WhatsApp
  marketing: 59,               // R$ 0,59 — cada msg de parcial/incentivo/empate
  taxa_campanha: 300000,        // R$ 3000,00 — 1x por edicao
  manutencao: 20000,           // R$ 200,00/mes pós-campanha
  // legacy — nao usar mais. Mantido pra leitura de transacoes antigas.
  voto_spc_whatsapp: 60,
} as const;

export type MotivoDebito =
  | "voto_minimo"
  | "voto_spc"
  | "whatsapp_confirmacao"
  | "marketing"
  | "taxa_campanha"
  | "manutencao";

// Helper formato exibicao R$
export function formatarReais(centavos: number): string {
  return `R$ ${(centavos / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
