import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { ArrowLeft, Ticket, CheckCircle2, XCircle, Clock } from "lucide-react";
import { isSuperAdmin } from "@/lib/super-admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { formatarReais } from "@/lib/creditos";
import { CupomForm } from "./CupomForm";
import { CupomActions } from "./CupomActions";

export const dynamic = "force-dynamic";

type CupomRow = {
  id: string;
  codigo: string;
  valor_centavos: number;
  tipo: "multi_tenant_1x_cada" | "uso_unico_global" | "multi_uso_livre";
  expira_em: string | null;
  max_usos: number | null;
  usos_atuais: number;
  ativo: boolean;
  descricao: string | null;
  criado_em: string;
};

const TIPO_LABEL: Record<CupomRow["tipo"], string> = {
  multi_tenant_1x_cada: "Multi-tenant (1x cada)",
  uso_unico_global: "Uso único global",
  multi_uso_livre: "Multi-uso livre",
};

export default async function SuperCuponsPage() {
  if (!(await isSuperAdmin())) redirect("/super/login");

  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("cupons")
    .select(
      "id, codigo, valor_centavos, tipo, expira_em, max_usos, usos_atuais, ativo, descricao, criado_em"
    )
    .order("criado_em", { ascending: false });

  const cupons = (data ?? []) as CupomRow[];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <Link
        href="/super"
        className="text-sm text-cdl-blue hover:underline inline-flex items-center gap-1 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </Link>

      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold text-cdl-blue flex items-center gap-3">
          <Ticket className="w-8 h-8" />
          Cupons promocionais
        </h1>
        <p className="text-muted mt-1">
          Crie códigos que tenants resgatam em <code>/admin/creditos</code> pra
          ganhar saldo na carteira.
        </p>
      </header>

      <Card className="mb-8">
        <CardContent>
          <h2 className="font-display text-lg font-bold text-cdl-blue mb-3">
            Novo cupom
          </h2>
          <CupomForm />
        </CardContent>
      </Card>

      <h2 className="font-display text-lg font-bold text-cdl-blue mb-3">
        Cupons criados ({cupons.length})
      </h2>

      {cupons.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted text-center py-8">
              Nenhum cupom criado ainda.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {cupons.map((c) => (
            <CupomCard key={c.id} c={c} />
          ))}
        </div>
      )}
    </div>
  );
}

function CupomCard({ c }: { c: CupomRow }) {
  const expirado =
    c.expira_em !== null && new Date(c.expira_em).getTime() < Date.now();
  const esgotado = c.max_usos !== null && c.usos_atuais >= c.max_usos;
  const inativo = !c.ativo || expirado || esgotado;

  const status = !c.ativo
    ? { icon: <XCircle className="w-3 h-3" />, label: "Desativado", cls: "bg-zinc-200 text-zinc-700" }
    : expirado
      ? { icon: <Clock className="w-3 h-3" />, label: "Expirado", cls: "bg-zinc-200 text-zinc-700" }
      : esgotado
        ? { icon: <Clock className="w-3 h-3" />, label: "Esgotado", cls: "bg-amber-100 text-amber-700" }
        : { icon: <CheckCircle2 className="w-3 h-3" />, label: "Ativo", cls: "bg-cdl-green/15 text-cdl-green-dark" };

  return (
    <Card className={inativo ? "opacity-70" : ""}>
      <CardContent>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <code className="text-lg font-mono font-bold text-cdl-blue bg-cdl-blue/5 px-2 py-0.5 rounded">
                {c.codigo}
              </code>
              <span
                className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded ${status.cls}`}
              >
                {status.icon} {status.label}
              </span>
              <span className="text-lg font-mono font-bold text-cdl-green-dark">
                +{formatarReais(c.valor_centavos)}
              </span>
            </div>
            <div className="text-xs text-muted flex flex-wrap gap-x-4 gap-y-1">
              <span>{TIPO_LABEL[c.tipo]}</span>
              <span>
                Usos:{" "}
                <strong className="text-foreground tabular-nums">
                  {c.usos_atuais}
                  {c.max_usos !== null ? ` / ${c.max_usos}` : ""}
                </strong>
              </span>
              {c.expira_em && (
                <span>
                  Expira:{" "}
                  <strong className="text-foreground">
                    {new Date(c.expira_em).toLocaleString("pt-BR", {
                      timeZone: "America/Sao_Paulo",
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </strong>
                </span>
              )}
            </div>
            {c.descricao && (
              <p className="text-xs text-muted mt-2 italic">{c.descricao}</p>
            )}
          </div>
          <CupomActions
            id={c.id}
            ativo={c.ativo}
            podeDeletar={c.usos_atuais === 0}
          />
        </div>
      </CardContent>
    </Card>
  );
}
