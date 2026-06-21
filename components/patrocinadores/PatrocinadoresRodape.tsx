import type { Patrocinador } from "@/lib/patrocinadores/types";

// Rodape discreto pra usar em /votar/*. Todos os logos numa fila so',
// alturas escalonadas por nivel mas mais compactas que a versao da home.
// Sem cabecalho grande "Patrocinadores oficiais" — apenas uma linha
// fininha "Apoio".

const ALTURA_PX: Record<string, number> = {
  master: 56,
  ouro: 44,
  prata: 36,
  bronze: 32,
  apoio: 28,
};

export function PatrocinadoresRodape({
  patrocinadores,
}: {
  patrocinadores: Patrocinador[];
}) {
  if (patrocinadores.length === 0) return null;

  return (
    <section className="bg-cream-100/40 border-t border-[rgba(10,42,94,0.08)] py-6">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-navy-800/50 text-center mb-3">
          apoio
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 sm:gap-x-8">
          {patrocinadores.map((p) => {
            const h = ALTURA_PX[p.nivel] ?? 32;
            const conteudo = (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.logo_url}
                alt={p.nome}
                title={p.nome}
                style={{
                  height: h,
                  width: "auto",
                  maxWidth: h * 3.5,
                }}
                className="object-contain opacity-70 hover:opacity-100 transition-opacity"
              />
            );
            return p.link ? (
              <a
                key={p.id}
                href={p.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block"
              >
                {conteudo}
              </a>
            ) : (
              <div key={p.id} className="inline-block">
                {conteudo}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
