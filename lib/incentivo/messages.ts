export type Elegivel = {
  votante_id: string;
  votante_nome: string;
  whatsapp: string;
  categoria_nome: string;
  subcategoria_id: string;
  subcategoria_nome: string;
  candidato_perdendo_id: string;
  candidato_perdendo_nome: string;
  candidato_perdendo_votos: number;
  candidato_lider_nome: string;
  candidato_lider_votos: number;
  diferenca: number;
};

// Contexto do tenant injetado nas mensagens.
// `nomeCampanha` vem de `edicao.nome` (ex: "Melhores do Ano CDL Aracaju 2025").
// `dominio` vem de `tenant.dominio` (ex: "votar.cdlaju.com.br").
export type TenantCtx = {
  nomeCampanha: string;
  dominio: string;
};

export function formatVotosMil(total: number): string {
  if (total <= 0) return "0";
  if (total < 1000) return total.toLocaleString("pt-BR");
  return `${Math.ceil(total / 1000).toLocaleString("pt-BR")} mil`;
}

export function calcularDias(inicio: string | null | undefined): number {
  if (!inicio) return 1;
  const ms = Date.now() - new Date(inicio).getTime();
  return Math.max(1, Math.floor(ms / 86_400_000));
}

export function formatDias(dias: number): string {
  return dias === 1 ? "1 dia" : `${dias} dias`;
}

export function montarMensagem(
  e: Elegivel,
  votosFmt: string,
  diasFmt: string,
  ctx: TenantCtx
): string {
  const primeiroNome = (e.votante_nome.split(" ")[0] ?? "").trim() || "amigo(a)";
  const empate = e.diferenca === 0;

  if (empate) {
    return [
      `🚨 EMPATE TÉCNICO, ${primeiroNome}!`,
      "",
      `A votação dos ${ctx.nomeCampanha} está NA RETA FINAL e já passou de ${votosFmt} votos em ${diasFmt}.`,
      "",
      `⚖️ Seu voto em *${e.candidato_perdendo_nome}* para Melhor ${e.subcategoria_nome} está EMPATADO com *${e.candidato_lider_nome}*.`,
      "",
      `Cada voto agora pode definir o vencedor.`,
      "",
      `Compartilhe esta votação com 3 amigos AGORA pra desempatar:`,
      `🌐 https://${ctx.dominio}`,
      "",
      `A disputa está nas suas mãos. 🏆`,
    ].join("\n");
  }

  const diff = e.diferenca === 1 ? "1 voto" : `${e.diferenca} votos`;
  return [
    `🏆 Oi, ${primeiroNome}!`,
    "",
    `Os ${ctx.nomeCampanha} já passaram de ${votosFmt} votos em ${diasFmt} — obrigado pela sua participação!`,
    "",
    `Você votou em ${e.candidato_perdendo_nome} para Melhor ${e.subcategoria_nome}. ${e.candidato_lider_nome} está na frente por só ${diff}.`,
    "",
    `Compartilhe o link com seus contatos e ajude quem você votou:`,
    `🌐 https://${ctx.dominio}`,
    "",
    `Cada voto faz diferença!`,
  ].join("\n");
}

export function montarSms(
  e: Elegivel,
  votosFmt: string,
  diasFmt: string,
  ctx: TenantCtx
): string {
  const primeiroNome = (e.votante_nome.split(" ")[0] ?? "").trim() || "amigo";
  if (e.diferenca === 0) {
    return `EMPATE! ${primeiroNome}, seu voto em ${e.candidato_perdendo_nome} (${e.subcategoria_nome}) esta EMPATADO. Compartilhe pra desempatar: ${ctx.dominio}`;
  }
  const trecho = `disputa apertada por ${e.diferenca} ${e.diferenca === 1 ? "voto" : "votos"}`;
  return `Ola ${primeiroNome}! ${votosFmt} votos em ${diasFmt}. Voce votou em ${e.candidato_perdendo_nome} (${e.subcategoria_nome}). ${trecho}. Compartilhe: ${ctx.dominio}`;
}

export function diferencaParaTemplate(diferenca: number): string {
  if (diferenca === 0) return "(empatado)";
  if (diferenca === 1) return "1 voto";
  return `${diferenca} votos`;
}

export function primeiroNomeDe(nomeCompleto: string): string {
  return (nomeCompleto.split(" ")[0] ?? "").trim() || "amigo(a)";
}
