import { Card, CardContent } from "@/components/ui/Card";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { Users, Award, MessageSquare, Inbox, Vote, Camera } from "lucide-react";

export default async function AdminDashboard() {
  const supabase = createSupabaseAdminClient();

  const [
    { data: edicao },
    { count: votantes },
    { count: votos },
    { count: candidatos },
    { count: pendentes },
    { count: whatsapps },
  ] = await Promise.all([
    supabase
      .from("edicao")
      .select("id, ano, nome, inicio_votacao, fim_votacao")
      .eq("ativa", true)
      .order("ano", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("votantes").select("*", { head: true, count: "exact" }),
    supabase.from("votos").select("*", { head: true, count: "exact" }),
    supabase.from("candidatos").select("*", { head: true, count: "exact" }).eq("status", "aprovado"),
    supabase.from("candidatos").select("*", { head: true, count: "exact" }).eq("status", "pendente"),
    supabase.from("votantes").select("*", { head: true, count: "exact" }).eq("whatsapp_validado", true),
  ]);

  const fmt = (n: number | null | undefined) => (n ?? 0).toLocaleString("pt-BR");

  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-bold text-cdl-blue">Visão geral</h1>
        {edicao ? (
          <p className="text-muted mt-1">
            {edicao.nome} · Votação até {new Date(edicao.fim_votacao).toLocaleString("pt-BR")}
          </p>
        ) : (
          <p className="text-red-600 mt-1 font-medium">⚠ Nenhuma edição ativa configurada</p>
        )}
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Stat icon={<Users />} label="Votantes" value={fmt(votantes)} accent="blue" />
        <Stat icon={<Vote />} label="Votos registrados" value={fmt(votos)} accent="green" />
        <Stat icon={<Award />} label="Candidatos ativos" value={fmt(candidatos)} accent="yellow" />
        <Stat icon={<Inbox />} label="Sugestões pendentes" value={fmt(pendentes)} accent="blue" />
        <Stat icon={<MessageSquare />} label="WhatsApps validados" value={fmt(whatsapps)} accent="green" />
        <Stat icon={<Camera />} label="Selfies registradas" value={fmt(votantes)} accent="yellow" />
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: "blue" | "green" | "yellow";
}) {
  const accents = {
    blue: "bg-cdl-blue/10 text-cdl-blue",
    green: "bg-cdl-green/10 text-cdl-green",
    yellow: "bg-cdl-yellow/15 text-cdl-yellow-dark",
  } as const;
  return (
    <Card>
      <CardContent>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted">{label}</p>
            <p className="font-display text-3xl font-bold text-foreground mt-2">{value}</p>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accents[accent]}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
