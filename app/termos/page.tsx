import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Termos de Uso — Melhores do Ano CDL Aracaju 2025",
};

export default function TermosPage() {
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
          <h1 className="font-display text-3xl font-bold text-cdl-blue mb-2">Termos de Uso</h1>
          <p className="text-sm text-muted mb-8">Última atualização: 25/04/2026</p>

          <Section titulo="1. Aceitação">
            <p>
              Ao acessar a plataforma <strong>votar.cdlaju.com.br</strong> e participar da votação <em>Melhores do Ano CDL Aracaju 2025</em>, você concorda integralmente com estes Termos de Uso. Caso não concorde com algum dos itens, não utilize a plataforma.
            </p>
          </Section>

          <Section titulo="2. Sobre a votação">
            <p>
              A votação <em>Melhores do Ano CDL Aracaju 2025</em> é uma iniciativa promovida pela <strong>Câmara de Dirigentes Lojistas de Aracaju (CDL Aracaju)</strong>, com o objetivo de reconhecer estabelecimentos, profissionais e empresas que se destacaram no comércio e nos serviços do município ao longo do ano.
            </p>
            <p>
              A participação é <strong>voluntária, gratuita e aberta a qualquer pessoa</strong> com CPF válido.
            </p>
          </Section>

          <Section titulo="3. Regras de participação">
            <ul>
              <li>Cada CPF poderá votar uma única vez em cada subcategoria.</li>
              <li>O sistema permite no máximo <strong>2 (dois) cadastros distintos por dispositivo</strong> (mesmo aparelho/navegador), para coibir fraudes.</li>
              <li>É obrigatória a captura de uma imagem facial (selfie) ao vivo no momento da votação como prova de participação.</li>
              <li>É vedado utilizar dados falsos ou de terceiros sem autorização.</li>
              <li>É vedado o uso de robôs, scripts ou qualquer mecanismo automatizado para votar ou sugerir candidatos.</li>
              <li>O votante poderá sugerir candidatos não listados, sob a condição de que o nome representa um estabelecimento, produto, serviço ou profissional <strong>real</strong>.</li>
              <li>A CDL Aracaju reserva o direito de excluir, mesclar ou renomear candidatos a qualquer tempo, em caso de duplicidade, conteúdo ofensivo ou irregularidade.</li>
            </ul>
          </Section>

          <Section titulo="4. Apuração e divulgação">
            <p>
              Os resultados serão apurados de forma automática pelo sistema com base no número de votos válidos recebidos por cada candidato em cada subcategoria. A divulgação dos vencedores será feita em evento oficial da CDL Aracaju, com data a ser anunciada.
            </p>
            <p>
              Votantes que optarem por receber o resultado em primeira mão via WhatsApp serão notificados antes da divulgação pública, mediante validação prévia do número.
            </p>
          </Section>

          <Section titulo="5. Limitação de responsabilidade">
            <p>
              A CDL Aracaju não se responsabiliza por:
            </p>
            <ul>
              <li>Falhas de conexão, indisponibilidade momentânea da plataforma ou problemas no dispositivo do votante.</li>
              <li>Decisões editoriais sobre os candidatos cadastrados.</li>
              <li>Conteúdo de candidatos sugeridos por terceiros antes da moderação.</li>
            </ul>
          </Section>

          <Section titulo="6. Propriedade intelectual">
            <p>
              Todos os direitos relativos à marca <strong>CDL Aracaju</strong>, à identidade visual da plataforma e ao prêmio <em>Melhores do Ano</em> são de propriedade exclusiva da Câmara de Dirigentes Lojistas de Aracaju.
            </p>
          </Section>

          <Section titulo="7. Suspensão e exclusão">
            <p>
              A CDL Aracaju poderá suspender ou cancelar a participação de qualquer votante que descumprir estes Termos, sem aviso prévio, mantendo o registro dos dados para fins de auditoria.
            </p>
          </Section>

          <Section titulo="8. Alterações">
            <p>
              Estes Termos poderão ser alterados a qualquer momento, com publicação da versão atualizada nesta mesma página. Recomendamos revisão periódica.
            </p>
          </Section>

          <Section titulo="9. Foro">
            <p>
              Fica eleito o foro da comarca de <strong>Aracaju/SE</strong> para dirimir quaisquer dúvidas decorrentes destes Termos.
            </p>
          </Section>

          <Section titulo="10. Privacidade">
            <p>
              O tratamento dos seus dados pessoais está descrito em nossa <Link href="/privacidade" className="text-cdl-blue underline">Política de Privacidade</Link>, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
            </p>
          </Section>

          <p className="text-sm text-muted mt-12">
            Para dúvidas, entre em contato pela CDL Aracaju.
          </p>
        </article>
      </main>

      <footer className="bg-cdl-blue-dark text-white/80 py-6">
        <div className="mx-auto max-w-3xl px-4 text-center text-sm">
          © 2026 CDL Aracaju · <Link href="/privacidade" className="hover:text-white">Privacidade</Link>
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
