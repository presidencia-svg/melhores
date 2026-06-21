import { getEdicaoStatus } from "@/lib/edicao-status";
import { VotacaoEncerrada } from "@/components/voto/VotacaoEncerrada";
import { listarPatrocinadores } from "@/lib/patrocinadores";
import { PatrocinadoresRodape } from "@/components/patrocinadores/PatrocinadoresRodape";

// Layout server-side de /votar/* — bloqueia qualquer rota da votacao
// quando fim_votacao ja passou e mostra a pagina de "Encerrada".
// Tambem cobre os endpoints da fluxo (selfie, categorias, c/[..], finalizar).
//
// force-dynamic: status muda com o relogio (nao_iniciada → aberta → encerrada),
// nao pode cachear estatico. Vercel CDN tava mantendo "Encerrada" servido apos
// transicao pra "aberta".
export const dynamic = "force-dynamic";

export default async function VotarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const status = await getEdicaoStatus();

  if (status.status === "encerrada") {
    return (
      <VotacaoEncerrada
        fimVotacao={status.edicao.fim_votacao}
        nomeEdicao={status.edicao.nome}
      />
    );
  }

  // Patrocinadores aparecem como rodape discreto em TODAS as telas
  // da votacao (entrada, categorias, voto, selfie, finalizar, etc).
  // Lista so' pra edicao atual em andamento — pulamos a query quando
  // nao ha edicao (caso raro: tenant sem edicao definida).
  const patrocinadores =
    status.status === "sem_edicao"
      ? []
      : await listarPatrocinadores(status.edicao.id);

  return (
    <>
      {children}
      <PatrocinadoresRodape patrocinadores={patrocinadores} />
    </>
  );
}
