import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { ArrowLeft, Mail } from "lucide-react";

export const metadata = {
  title: "Política de Privacidade — Melhores do Ano CDL Aracaju 2025",
};

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link href="/">
            <Logo />
          </Link>
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted hover:text-cdl-blue">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Link>
        </div>
      </header>

      <main className="flex-1 py-10">
        <article className="mx-auto max-w-3xl px-4 prose prose-slate">
          <h1 className="font-display text-3xl font-bold text-cdl-blue mb-2">Política de Privacidade</h1>
          <p className="text-sm text-muted mb-8">Última atualização: 25/04/2026</p>

          <p className="text-sm bg-cdl-blue/5 border border-cdl-blue/10 rounded-lg p-4 mb-8">
            Esta política descreve como a <strong>CDL Aracaju</strong> coleta, usa, armazena e protege seus dados pessoais, em conformidade com a <strong>Lei Geral de Proteção de Dados (LGPD — Lei 13.709/2018)</strong>.
          </p>

          <Section titulo="1. Controlador dos dados">
            <p>
              <strong>Câmara de Dirigentes Lojistas de Aracaju (CDL Aracaju)</strong>, atuando na qualidade de Controladora dos dados pessoais coletados nesta plataforma.
            </p>
          </Section>

          <Section titulo="2. Dados coletados">
            <p>Para participar da votação, são coletadas as seguintes informações:</p>
            <ul>
              <li><strong>CPF</strong> (Cadastro de Pessoa Física), validado em base oficial via SPC Brasil.</li>
              <li><strong>Nome completo</strong> retornado automaticamente pela base oficial a partir do CPF.</li>
              <li><strong>Imagem facial (selfie)</strong> capturada ao vivo no momento da votação.</li>
              <li><strong>Endereço de IP</strong> e <strong>identificador do dispositivo</strong> usados para acessar a plataforma.</li>
              <li><strong>Informações do navegador</strong> (user-agent: tipo, versão, sistema operacional).</li>
              <li><strong>Carimbos de data e hora</strong> da identificação e dos votos registrados.</li>
              <li><strong>Número de WhatsApp</strong> (somente se você optar por recebê-lo para o resultado).</li>
            </ul>
          </Section>

          <Section titulo="3. Finalidade do tratamento">
            <p>Os dados coletados são utilizados exclusivamente para:</p>
            <ul>
              <li>Garantir a unicidade dos votos (1 CPF = 1 voto por subcategoria).</li>
              <li>Prevenir e detectar fraudes (votos múltiplos, robôs, etc.).</li>
              <li>Permitir auditoria do processo de votação se necessário.</li>
              <li>Notificar sobre os resultados (apenas para quem fornecer o WhatsApp opt-in).</li>
            </ul>
            <p>
              <strong>Não há</strong> uso para marketing direto, perfilamento, divulgação a terceiros ou venda de dados.
            </p>
          </Section>

          <Section titulo="4. Base legal (LGPD)">
            <p>O tratamento se baseia em:</p>
            <ul>
              <li>
                <strong>Consentimento</strong> (Art. 7º, I, LGPD) — você consente expressamente ao iniciar a votação.
              </li>
              <li>
                <strong>Legítimo interesse</strong> (Art. 7º, IX) — para prevenir fraudes e garantir a integridade da votação.
              </li>
              <li>
                <strong>Cumprimento de obrigação legal</strong> (Art. 7º, II) — auditoria fiscal e contábil quando aplicável.
              </li>
            </ul>
          </Section>

          <Section titulo="5. Como protegemos seus dados">
            <ul>
              <li><strong>CPF criptografado</strong> em hash SHA-256 com salt único, no banco.</li>
              <li><strong>Selfies armazenadas em bucket privado</strong>, acessíveis apenas pela equipe da CDL com chave de serviço.</li>
              <li><strong>Conexão HTTPS</strong> (TLS 1.3) em todas as etapas, com HSTS de 2 anos.</li>
              <li><strong>Controles de acesso</strong> ao banco protegidos por chave de serviço (não exposta a cliente).</li>
              <li><strong>Limites de tentativas</strong> por IP e dispositivo.</li>
              <li><strong>Headers de segurança</strong>: X-Frame-Options, Content-Security, Permissions-Policy.</li>
            </ul>
          </Section>

          <Section titulo="6. Compartilhamento com terceiros">
            <p>Compartilhamos dados estritamente com os seguintes operadores, sob contrato:</p>
            <ul>
              <li><strong>SPC Brasil</strong> — apenas o CPF é consultado para validação do nome.</li>
              <li><strong>Z-API</strong> — apenas o número de WhatsApp opt-in é usado para envio de mensagens.</li>
              <li><strong>Supabase / Vercel</strong> — infraestrutura de banco de dados e hospedagem.</li>
            </ul>
            <p>Nenhum dos operadores acima utiliza os dados para outras finalidades.</p>
          </Section>

          <Section titulo="7. Tempo de retenção">
            <ul>
              <li>Dados de identificação e votos: pelo período da edição + <strong>180 dias</strong> para auditoria.</li>
              <li>Selfies: pelo período da edição + 180 dias, depois excluídas em definitivo.</li>
              <li>WhatsApps validados: até o anúncio dos vencedores ou solicitação de exclusão.</li>
            </ul>
          </Section>

          <Section titulo="8. Seus direitos (LGPD Art. 18)">
            <p>Você pode, a qualquer momento, solicitar:</p>
            <ul>
              <li>Confirmação da existência de tratamento dos seus dados.</li>
              <li>Acesso aos dados que mantemos sobre você.</li>
              <li>Correção de dados incompletos, inexatos ou desatualizados.</li>
              <li>Anonimização, bloqueio ou eliminação de dados desnecessários.</li>
              <li>Portabilidade dos dados.</li>
              <li>Revogação do consentimento.</li>
            </ul>
            <p>
              Para exercer qualquer desses direitos, entre em contato pelos canais oficiais da CDL Aracaju.
            </p>
          </Section>

          <Section titulo="9. Cookies">
            <p>
              Utilizamos cookies estritamente necessários para o funcionamento da votação:
            </p>
            <ul>
              <li><code>mda_session</code> — mantém sua sessão de votação ativa por 24h. <strong>HttpOnly + Secure</strong>.</li>
              <li><code>mda_admin</code> — apenas para o painel administrativo da CDL.</li>
            </ul>
            <p>Não usamos cookies de terceiros, marketing ou rastreamento.</p>
          </Section>

          <Section titulo="10. Encarregado de Dados (DPO)">
            <p>
              Para questões relativas ao tratamento de dados, contate o Encarregado de Proteção de Dados da CDL Aracaju pelos canais institucionais.
            </p>
            <p className="flex items-center gap-2 text-sm text-cdl-blue mt-2">
              <Mail className="w-4 h-4" />
              <span>contato@cdlaju.com.br</span>
            </p>
          </Section>

          <Section titulo="11. Alterações">
            <p>
              Esta política pode ser atualizada para refletir mudanças legais ou operacionais. A versão vigente será sempre publicada nesta página.
            </p>
          </Section>
        </article>
      </main>

      <footer className="bg-cdl-blue-dark text-white/80 py-6">
        <div className="mx-auto max-w-3xl px-4 text-center text-sm">
          © 2026 CDL Aracaju · <Link href="/termos" className="hover:text-white">Termos de Uso</Link>
        </div>
      </footer>
    </div>
  );
}

function Section({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="font-display text-xl font-bold text-cdl-blue mb-2">{titulo}</h2>
      <div className="text-foreground leading-relaxed text-sm space-y-2">{children}</div>
    </section>
  );
}
