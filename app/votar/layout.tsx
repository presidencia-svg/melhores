import { getEdicaoStatus } from "@/lib/edicao-status";
import { VotacaoEncerrada } from "@/components/voto/VotacaoEncerrada";

// Layout server-side de /votar/* — bloqueia qualquer rota da votacao
// quando fim_votacao ja passou e mostra a pagina de "Encerrada".
// Tambem cobre os endpoints da fluxo (selfie, categorias, c/[..], finalizar).
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

  return <>{children}</>;
}
