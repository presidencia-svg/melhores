import {
  agruparPorNivel,
  LABEL_NIVEIS,
  type Patrocinador,
} from "@/lib/patrocinadores";

// Altura do logo varia por nivel — efeito visual de hierarquia.
const ALTURA_PX: Record<string, number> = {
  master: 96,
  ouro: 72,
  prata: 56,
  bronze: 44,
  apoio: 36,
};

type Props = {
  patrocinadores: Patrocinador[];
  variante?: "claro" | "escuro";  // claro = fundo cream, escuro = fundo navy
  titulo?: string;
};

export function PatrocinadoresSection({
  patrocinadores,
  variante = "claro",
  titulo = "Patrocinadores",
}: Props) {
  if (patrocinadores.length === 0) return null;

  const grupos = agruparPorNivel(patrocinadores);
  const bgClass = variante === "escuro" ? "bg-navy-900" : "bg-cream-100";
  const textClass = variante === "escuro" ? "text-cream-100" : "text-navy-800";
  const mutedClass =
    variante === "escuro" ? "text-cream-100/60" : "text-navy-800/50";

  return (
    <section className={`${bgClass} py-12 sm:py-16`}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center mb-8 sm:mb-12">
          <p
            className={`text-[11px] uppercase tracking-[0.2em] font-bold ${mutedClass}`}
          >
            quem apoia
          </p>
          <h2
            className={`font-display ${textClass} mt-2`}
            style={{
              fontSize: "clamp(24px, 5vw, 36px)",
              lineHeight: 1.1,
              fontWeight: 300,
            }}
          >
            {titulo}
          </h2>
        </div>

        <div className="flex flex-col gap-8">
          {grupos.map(({ nivel, itens }) => (
            <div key={nivel}>
              <p
                className={`text-[10px] uppercase tracking-[0.25em] font-bold text-center mb-4 ${mutedClass}`}
              >
                {LABEL_NIVEIS[nivel]}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
                {itens.map((p) => {
                  const h = ALTURA_PX[nivel] ?? 48;
                  const conteudo = (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.logo_url}
                      alt={p.nome}
                      title={p.nome}
                      style={{
                        height: h,
                        width: "auto",
                        maxWidth: h * 3,
                      }}
                      className={`object-contain transition-opacity ${variante === "escuro" ? "brightness-0 invert opacity-80 hover:opacity-100" : "opacity-90 hover:opacity-100"}`}
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
          ))}
        </div>
      </div>
    </section>
  );
}
