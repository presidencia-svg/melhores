import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getCurrentTenant } from "@/lib/tenant/resolver";
import { getEdicaoStatus } from "@/lib/edicao-status";
import { getSaldo, formatarReais, PRECOS } from "@/lib/creditos";
import {
  CheckCircle2,
  Circle,
  AlertCircle,
  ArrowRight,
  Palette,
  CalendarRange,
  MessageSquare,
  ShieldCheck,
  FolderTree,
  Trophy,
  Wallet,
  Instagram,
  Share2,
  Rocket,
} from "lucide-react";

export const dynamic = "force-dynamic";

type Estado = "feito" | "pendente" | "atencao";

type Item = {
  id: string;
  estado: Estado;
  icon: React.ReactNode;
  titulo: string;
  descricao: string;
  cta: { label: string; href: string };
  detalhe?: string;
};

type Secao = {
  titulo: string;
  subtitulo: string;
  itens: Item[];
};

export default async function GuiaPage() {
  const tenant = await getCurrentTenant();
  const supabase = createSupabaseAdminClient();
  const status = await getEdicaoStatus(tenant.id);
  const edicao = status.status !== "sem_edicao" ? status.edicao : null;

  // Coleta paralela de tudo
  const [
    { data: configs },
    { count: countCategorias },
    { count: countSubcategorias },
    { count: countCandidatos },
    saldo,
  ] = await Promise.all([
    supabase
      .from("app_config")
      .select("chave, valor")
      .eq("tenant_id", tenant.id),
    edicao
      ? supabase
          .from("categorias")
          .select("*", { head: true, count: "exact" })
          .eq("edicao_id", edicao.id)
          .eq("ativa", true)
      : Promise.resolve({ count: 0 }),
    edicao
      ? supabase
          .from("subcategorias")
          .select("*", { head: true, count: "exact" })
          .eq("edicao_id", edicao.id)
          .eq("ativa", true)
      : Promise.resolve({ count: 0 }),
    edicao
      ? supabase
          .from("candidatos")
          .select("*", { head: true, count: "exact" })
          .eq("edicao_id", edicao.id)
          .eq("status", "aprovado")
      : Promise.resolve({ count: 0 }),
    getSaldo(tenant.id),
  ]);

  const cfg = new Map((configs ?? []).map((c) => [c.chave, c.valor]));
  const onbWa = cfg.get("onboarding_whatsapp") === "feito";
  const sugestoesLigadas = (cfg.get("sugestoes_publicas") ?? "ligadas") !== "desligadas";

  const cats = countCategorias ?? 0;
  const subs = countSubcategorias ?? 0;
  const cands = countCandidatos ?? 0;

  const linkVotacao = tenant.dominio ? `https://${tenant.dominio}/votar` : null;

  // Define cada item
  const secoes: Secao[] = [
    {
      titulo: "1. Identidade da instituição",
      subtitulo: "Como sua marca aparece pra quem vota",
      itens: [
        {
          id: "logo",
          estado: tenant.logo_url ? "feito" : "pendente",
          icon: <Palette className="w-5 h-5" />,
          titulo: "Enviar logomarca da instituição",
          descricao:
            "PNG ou SVG transparente, idealmente com fundo claro. Aparece no topo do painel admin e na tela de votação.",
          cta: { label: "Ir para Marca", href: "/admin/marca" },
          detalhe: tenant.logo_url ? "Logo enviada" : "Logo padrão (CDL) — substitua",
        },
        {
          id: "cores",
          estado:
            tenant.cor_primaria && tenant.cor_secundaria ? "feito" : "atencao",
          icon: <Palette className="w-5 h-5" />,
          titulo: "Definir cores da marca",
          descricao:
            "Cor primária e secundária pra deixar a tela de votação com a cara da sua instituição. Opcional, mas recomendado.",
          cta: { label: "Configurar cores", href: "/admin/marca" },
          detalhe:
            tenant.cor_primaria && tenant.cor_secundaria
              ? `Primária ${tenant.cor_primaria} · Secundária ${tenant.cor_secundaria}`
              : "Usando cores padrão",
        },
      ],
    },
    {
      titulo: "2. A campanha",
      subtitulo: "Quando começa, quando termina, e o que vai votar",
      itens: [
        {
          id: "edicao",
          estado: edicao
            ? status.status === "encerrada"
              ? "atencao"
              : "feito"
            : "pendente",
          icon: <CalendarRange className="w-5 h-5" />,
          titulo: "Criar a edição da campanha",
          descricao:
            "Define o ano, o nome da edição e a janela de votação (quando abre, quando fecha).",
          cta: {
            label: edicao ? "Ver edições" : "Criar edição",
            href: "/admin/edicoes",
          },
          detalhe: edicao
            ? `${edicao.nome} · até ${new Date(edicao.fim_votacao).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" })}`
            : "Nenhuma edição criada",
        },
        {
          id: "categorias",
          estado: cats > 0 ? "feito" : "pendente",
          icon: <FolderTree className="w-5 h-5" />,
          titulo: "Cadastrar categorias e subcategorias",
          descricao:
            "Categorias agrupam o que se vota (ex: Gastronomia). Subcategorias são as disputas (ex: Melhor pizzaria, Melhor hamburgueria). Pelo menos 1 de cada.",
          cta: { label: "Gerenciar categorias", href: "/admin/categorias" },
          detalhe:
            cats > 0
              ? `${cats} categoria${cats > 1 ? "s" : ""} · ${subs} subcategoria${subs > 1 ? "s" : ""}`
              : "Nenhuma categoria",
        },
        {
          id: "candidatos",
          estado:
            cands > 0
              ? "feito"
              : sugestoesLigadas
                ? "atencao"
                : "pendente",
          icon: <Trophy className="w-5 h-5" />,
          titulo: "Cadastrar candidatos iniciais",
          descricao: sugestoesLigadas
            ? "Você pode pré-cadastrar candidatos OU deixar os votantes sugerirem na hora (sugestões públicas estão ligadas)."
            : "Sugestões públicas estão DESLIGADAS — votantes só escolhem quem você cadastrar. Cadastre todos antes de abrir a votação.",
          cta: { label: "Gerenciar candidatos", href: "/admin/candidatos" },
          detalhe:
            cands > 0
              ? `${cands} candidato${cands > 1 ? "s" : ""} aprovado${cands > 1 ? "s" : ""}`
              : sugestoesLigadas
                ? "0 candidatos — votantes sugerem na hora"
                : "0 candidatos — abrir votação assim impede voto",
        },
      ],
    },
    {
      titulo: "3. Validação dos votantes",
      subtitulo: "Como impedir voto fraudulento e validar identidade",
      itens: [
        {
          id: "whatsapp",
          estado: onbWa ? "feito" : "pendente",
          icon: <MessageSquare className="w-5 h-5" />,
          titulo: "Escolher modo de validação WhatsApp",
          descricao:
            "Decide se o votante recebe um código no WhatsApp (mais rigoroso, custa créditos) ou só CPF + selfie (mais simples).",
          cta: {
            label: onbWa ? "Trocar modo" : "Escolher",
            href: "/admin/onboarding?step=meta",
          },
          detalhe: onbWa
            ? `Modo: ${cfg.get("whatsapp_validacao") === "desligada" ? "Sem WhatsApp" : "Com WhatsApp"}`
            : "Não definido",
        },
        {
          id: "spc",
          estado: "feito",
          icon: <ShieldCheck className="w-5 h-5" />,
          titulo: "Validação de CPF (SPC Brasil)",
          descricao:
            "Cada cadastro confirma o nome real do votante na base oficial do SPC Brasil (R$ 0,25 por consulta). Já vem ligado por padrão.",
          cta: { label: "Ver no painel", href: "/admin" },
          detalhe:
            cfg.get("spc_consulta") === "desligado"
              ? "DESLIGADO — atenção, sem validação de CPF"
              : "Ligado (default)",
        },
      ],
    },
    {
      titulo: "4. Conta e crédito",
      subtitulo: "Pra plataforma debitar custos de voto e disparos",
      itens: [
        {
          id: "creditos",
          estado: saldo >= PRECOS.taxa_campanha ? "feito" : "pendente",
          icon: <Wallet className="w-5 h-5" />,
          titulo: "Recarregar créditos da carteira",
          descricao: `Cada voto custa ${formatarReais(PRECOS.voto_spc)}–${formatarReais(PRECOS.voto_spc_whatsapp)}, cada disparo de marketing ${formatarReais(PRECOS.marketing)}, taxa de campanha ${formatarReais(PRECOS.taxa_campanha)}. Recomendado: pelo menos R$ 500 antes de abrir.`,
          cta: { label: "Recarregar via Pix", href: "/admin/creditos" },
          detalhe: `Saldo atual: ${formatarReais(saldo)}`,
        },
      ],
    },
    {
      titulo: "5. Divulgação (opcional)",
      subtitulo: "Pra postar resultados automaticamente",
      itens: [
        {
          id: "instagram",
          estado: tenant.instagram_page_access_token ? "feito" : "atencao",
          icon: <Instagram className="w-5 h-5" />,
          titulo: "Conectar Instagram",
          descricao:
            "Pra postar parciais e pódio final automaticamente no perfil da instituição. Pode pular agora e configurar depois.",
          cta: {
            label: tenant.instagram_page_access_token
              ? "Reconfigurar"
              : "Conectar",
            href: "/admin/onboarding?step=instagram",
          },
          detalhe: tenant.instagram_username
            ? `@${tenant.instagram_username}`
            : "Não conectado",
        },
      ],
    },
    {
      titulo: "6. Lançar a votação",
      subtitulo: "Hora de espalhar o link",
      itens: [
        {
          id: "link",
          estado: linkVotacao && edicao ? "feito" : "pendente",
          icon: <Share2 className="w-5 h-5" />,
          titulo: "Compartilhar o link de votação",
          descricao:
            "Mande o link nas redes sociais, WhatsApp, e-mail e no site da instituição. Quanto mais divulgação, mais votos.",
          cta: {
            label: linkVotacao ? "Ver e copiar" : "Aguardando edição",
            href: linkVotacao ? "/admin" : "/admin/edicoes",
          },
          detalhe: linkVotacao ?? "Domínio não configurado",
        },
      ],
    },
  ];

  // Resumo de progresso
  const todosItens = secoes.flatMap((s) => s.itens);
  const obrigatorios = todosItens.filter((i) => i.estado !== "atencao");
  const feitos = todosItens.filter((i) => i.estado === "feito").length;
  const totalParaProgresso = todosItens.length;
  const pct = Math.round((feitos / totalParaProgresso) * 100);

  // Próximo item pendente (pra CTA principal)
  const proximoPendente =
    obrigatorios.find((i) => i.estado === "pendente") ??
    todosItens.find((i) => i.estado === "atencao") ??
    null;

  return (
    <div className="p-8 max-w-4xl">
      <header className="mb-6">
        <p className="kicker text-cdl-blue/60 text-xs uppercase tracking-widest mb-2">
          {tenant.nome}
        </p>
        <h1 className="font-display text-3xl font-bold text-cdl-blue flex items-center gap-3">
          <Rocket className="w-8 h-8" />
          Guia de implantação
        </h1>
        <p className="text-muted mt-2">
          Tudo que você precisa configurar pra colocar a votação no ar. Pode
          fazer na ordem ou pular pra qualquer item.
        </p>
      </header>

      {/* Progresso geral */}
      <Card className="mb-8">
        <CardContent>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted font-semibold">
                Progresso
              </p>
              <p className="font-display text-3xl font-bold text-cdl-blue">
                {feitos} de {totalParaProgresso}
                <span className="text-base text-muted font-normal ml-2">
                  ({pct}%)
                </span>
              </p>
            </div>
            {proximoPendente ? (
              <Link
                href={proximoPendente.cta.href}
                className="inline-flex items-center gap-2 h-11 px-5 rounded-md bg-cdl-blue text-white font-medium hover:bg-cdl-blue-dark"
              >
                Continuar: {proximoPendente.titulo}
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <span className="inline-flex items-center gap-2 h-11 px-5 rounded-md bg-cdl-green/15 text-cdl-green-dark font-medium">
                <CheckCircle2 className="w-5 h-5" />
                Pronto pra abrir!
              </span>
            )}
          </div>
          <div className="h-2 rounded-full bg-cdl-blue/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cdl-blue to-cdl-green transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Seções */}
      <div className="flex flex-col gap-8">
        {secoes.map((s) => (
          <section key={s.titulo}>
            <h2 className="font-display text-lg font-bold text-cdl-blue mb-1">
              {s.titulo}
            </h2>
            <p className="text-xs text-muted mb-3">{s.subtitulo}</p>
            <div className="flex flex-col gap-2">
              {s.itens.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-10 rounded-xl border border-cdl-blue/20 bg-cdl-blue/5 p-5 text-sm text-cdl-blue">
        <p className="font-display-bold mb-1">Travou em alguma etapa?</p>
        <p className="text-xs leading-relaxed">
          Toda mudança feita aqui pode ser revertida ou ajustada depois. Se algo
          não estiver claro, fale com o suporte da plataforma — a equipe da CDL
          Aracaju ajuda você a colocar tudo pra rodar.
        </p>
      </div>
    </div>
  );
}

function ItemCard({ item }: { item: Item }) {
  const estadoStyles = {
    feito: {
      icon: <CheckCircle2 className="w-5 h-5 text-cdl-green-dark" />,
      cardCls: "border-cdl-green/30 bg-cdl-green/5",
      iconBg: "bg-cdl-green/15 text-cdl-green-dark",
    },
    pendente: {
      icon: <Circle className="w-5 h-5 text-muted" />,
      cardCls: "border-border bg-card hover:border-cdl-blue/40",
      iconBg: "bg-cdl-blue/10 text-cdl-blue",
    },
    atencao: {
      icon: <AlertCircle className="w-5 h-5 text-amber-600" />,
      cardCls: "border-amber-300 bg-amber-50/60",
      iconBg: "bg-amber-100 text-amber-700",
    },
  }[item.estado];

  return (
    <div
      className={`rounded-xl border-2 p-4 transition-all ${estadoStyles.cardCls}`}
    >
      <div className="flex items-start gap-4 flex-wrap">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${estadoStyles.iconBg}`}
          >
            {item.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {estadoStyles.icon}
              <h3 className="font-display-bold text-navy-800 text-base leading-tight">
                {item.titulo}
              </h3>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              {item.descricao}
            </p>
            {item.detalhe && (
              <p
                className={`text-xs mt-2 font-medium ${
                  item.estado === "feito"
                    ? "text-cdl-green-dark"
                    : item.estado === "atencao"
                      ? "text-amber-700"
                      : "text-muted"
                }`}
              >
                {item.detalhe}
              </p>
            )}
          </div>
        </div>
        <Link
          href={item.cta.href}
          className={`shrink-0 inline-flex items-center gap-1 text-xs font-semibold px-3 py-2 rounded-md transition-colors ${
            item.estado === "feito"
              ? "text-cdl-green-dark hover:bg-cdl-green/15"
              : "bg-cdl-blue text-white hover:bg-cdl-blue-dark"
          }`}
        >
          {item.cta.label}
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
