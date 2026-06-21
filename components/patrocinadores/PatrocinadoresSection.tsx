import {
  agruparPorNivel,
  LABEL_NIVEIS,
  type Patrocinador,
} from "@/lib/patrocinadores/types";

// Altura do logo varia por nivel — efeito visual de hierarquia.
// Master ficou MUITO maior pra ser dominante (apresentador da campanha).
const ALTURA_PX: Record<string, number> = {
  master: 160,
  ouro: 110,
  prata: 78,
  bronze: 60,
  apoio: 48,
};

const MAX_WIDTH_MULT: Record<string, number> = {
  master: 4,
  ouro: 3.5,
  prata: 3,
  bronze: 3,
  apoio: 2.5,
};

type Props = {
  patrocinadores: Patrocinador[];
  variante?: "claro" | "escuro";
  titulo?: string;
};

export function PatrocinadoresSection({
  patrocinadores,
  variante = "claro",
  titulo = "Patrocinadores oficiais",
}: Props) {
  if (patrocinadores.length === 0) return null;

  const grupos = agruparPorNivel(patrocinadores);
  const grupoMaster = grupos.find((g) => g.nivel === "master");
  const grupoDemais = grupos.filter((g) => g.nivel !== "master");

  const bgClass = variante === "escuro" ? "bg-navy-900" : "bg-cream-100";
  const textClass = variante === "escuro" ? "text-cream-100" : "text-navy-800";
  const mutedClass =
    variante === "escuro" ? "text-cream-100/60" : "text-navy-800/50";
  const goldClass = variante === "escuro" ? "text-gold-400" : "text-gold-700";
  const dividerColor =
    variante === "escuro"
      ? "rgba(212,165,55,0.3)"
      : "rgba(10,42,94,0.12)";

  function renderLogo(p: Patrocinador, isMaster = false) {
    const h = ALTURA_PX[p.nivel] ?? 48;
    const mw = (MAX_WIDTH_MULT[p.nivel] ?? 3) * h;
    const conteudo = (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={p.logo_url}
        alt={p.nome}
        title={p.nome}
        style={{ height: h, width: "auto", maxWidth: mw }}
        className={`object-contain transition-opacity ${
          isMaster
            ? "opacity-100"
            : variante === "escuro"
              ? "brightness-0 invert opacity-85 hover:opacity-100"
              : "opacity-95 hover:opacity-100"
        }`}
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
  }

  return (
    <section className={`${bgClass} py-16 sm:py-24`}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center mb-10 sm:mb-14">
          <p
            className={`text-[11px] uppercase tracking-[0.25em] font-bold ${mutedClass}`}
          >
            quem apoia
          </p>
          <h2
            className={`font-display ${textClass} mt-2`}
            style={{
              fontSize: "clamp(28px, 6vw, 44px)",
              lineHeight: 1.1,
              fontWeight: 300,
            }}
          >
            {titulo}
          </h2>
        </div>

        {/* MASTER em destaque dominante */}
        {grupoMaster && (
          <div
            className="text-center pb-12 mb-12"
            style={{ borderBottom: `1px solid ${dividerColor}` }}
          >
            <p
              className={`text-[12px] uppercase tracking-[0.3em] font-bold ${goldClass} mb-6`}
            >
              {grupoMaster.itens.length === 1
                ? "apresentado por"
                : "patrocinadores master"}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-10 sm:gap-16">
              {grupoMaster.itens.map((p) => renderLogo(p, true))}
            </div>
          </div>
        )}

        {/* Demais níveis */}
        {grupoDemais.length > 0 && (
          <div className="flex flex-col gap-10">
            {grupoDemais.map(({ nivel, itens }) => (
              <div key={nivel}>
                <p
                  className={`text-[10px] uppercase tracking-[0.3em] font-bold text-center mb-5 ${mutedClass}`}
                >
                  {LABEL_NIVEIS[nivel]}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14">
                  {itens.map((p) => renderLogo(p))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
