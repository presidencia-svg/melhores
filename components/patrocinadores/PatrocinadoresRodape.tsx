import {
  agruparPorNivel,
  type Patrocinador,
} from "@/lib/patrocinadores/types";

// Rodape pra usar em /votar/*. Master tem destaque dominante no topo,
// demais niveis embaixo agrupados. Bem menor que a versao da home mas
// ainda com hierarquia clara.

const ALTURA_PX: Record<string, number> = {
  patrocinio: 130,
  apoio: 64,
};

export function PatrocinadoresRodape({
  patrocinadores,
}: {
  patrocinadores: Patrocinador[];
}) {
  if (patrocinadores.length === 0) return null;

  const grupos = agruparPorNivel(patrocinadores);
  const grupoMaster = grupos.find((g) => g.nivel === "patrocinio");
  const grupoDemais = grupos.filter((g) => g.nivel !== "patrocinio");

  function renderLogo(p: Patrocinador, isPatrocinio = false) {
    const h = ALTURA_PX[p.nivel] ?? 64;
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
        className={`object-contain transition-opacity ${
          isPatrocinio ? "opacity-100" : "opacity-80 hover:opacity-100"
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
    <section className="bg-cream-100/60 border-t border-[rgba(10,42,94,0.1)] py-10 sm:py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        {/* PATROCINIO em destaque dominante */}
        {grupoMaster && (
          <div
            className={`text-center ${grupoDemais.length > 0 ? "pb-8 mb-8 border-b border-[rgba(10,42,94,0.08)]" : ""}`}
          >
            <p className="text-[11px] uppercase tracking-[0.3em] font-bold text-gold-700 mb-4">
              apresentado por
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
              {grupoMaster.itens.map((p) => renderLogo(p, true))}
            </div>
          </div>
        )}

        {/* Demais niveis — sem rotulo, tamanho do logo ja' comunica hierarquia */}
        {grupoDemais.length > 0 && (
          <div className="flex flex-col gap-6">
            {grupoDemais.map(({ nivel, itens }) => (
              <div
                key={nivel}
                className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 sm:gap-x-10"
              >
                {itens.map((p) => renderLogo(p))}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
