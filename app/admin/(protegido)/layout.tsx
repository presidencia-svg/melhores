import { redirect } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { isAdmin } from "@/lib/admin/auth";
import { getCurrentTenant } from "@/lib/tenant/resolver";
import { LayoutDashboard, FolderTree, Users, Trophy, MessageSquare, Inbox, LogOut, UserCheck, ShieldCheck, BarChart3, Swords, Medal, Newspaper, Award, Wallet, Palette } from "lucide-react";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isAdmin())) {
    redirect("/admin/login");
  }

  const tenant = await getCurrentTenant();

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-64 bg-cdl-blue-dark text-white flex flex-col print:hidden">
        <div className="px-6 py-6 border-b border-white/10">
          {tenant.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tenant.logo_url}
              alt={tenant.nome}
              className="h-14 w-auto max-w-full object-contain"
            />
          ) : (
            <Logo variant="white" className="text-white" />
          )}
          <p className="text-xs text-white/60 mt-2">{tenant.nome}</p>
        </div>

        <nav className="flex-1 p-3 flex flex-col gap-0.5 overflow-y-auto">
          <NavLink href="/admin" icon={<LayoutDashboard className="w-4 h-4" />}>
            Início
          </NavLink>

          <SectionLabel>Campanha</SectionLabel>
          <NavLink href="/admin/categorias" icon={<FolderTree className="w-4 h-4" />}>
            Categorias
          </NavLink>
          <NavLink href="/admin/candidatos" icon={<Users className="w-4 h-4" />}>
            Candidatos
          </NavLink>
          <NavLink href="/admin/sugestoes" icon={<Inbox className="w-4 h-4" />}>
            Sugestões recebidas
          </NavLink>

          <SectionLabel>Resultados</SectionLabel>
          <NavLink href="/admin/resultados" icon={<Trophy className="w-4 h-4" />}>
            Ranking ao vivo
          </NavLink>
          <NavLink href="/admin/duelos" icon={<Swords className="w-4 h-4" />}>
            Empates
          </NavLink>
          <NavLink href="/admin/podium" icon={<Medal className="w-4 h-4" />}>
            Pódio final
          </NavLink>
          <NavLink href="/admin/certificados" icon={<Award className="w-4 h-4" />}>
            Certificados
          </NavLink>

          <SectionLabel>Engajamento</SectionLabel>
          <NavLink href="/admin/votantes" icon={<UserCheck className="w-4 h-4" />}>
            Votantes
          </NavLink>
          <NavLink href="/admin/whatsapp" icon={<MessageSquare className="w-4 h-4" />}>
            Lista WhatsApp
          </NavLink>
          <NavLink href="/admin/whatsapp/insights" icon={<BarChart3 className="w-4 h-4" />}>
            Mensagens enviadas
          </NavLink>
          <NavLink href="/admin/imprensa" icon={<Newspaper className="w-4 h-4" />}>
            Imprensa
          </NavLink>

          <SectionLabel>Conta</SectionLabel>
          <NavLink href="/admin/marca" icon={<Palette className="w-4 h-4" />}>
            Marca
          </NavLink>
          <NavLink href="/admin/creditos" icon={<Wallet className="w-4 h-4" />}>
            Créditos
          </NavLink>
          <NavLink href="/admin/seguranca" icon={<ShieldCheck className="w-4 h-4" />}>
            Segurança
          </NavLink>
        </nav>

        <form action="/api/admin/logout" method="POST" className="p-3 border-t border-white/10">
          <button
            type="submit"
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-white/70 hover:bg-white/10 hover:text-white text-sm transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </form>
      </aside>

      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}

function NavLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2 rounded-lg text-white/80 hover:bg-white/10 hover:text-white text-sm font-medium transition-colors"
    >
      {icon}
      {children}
    </Link>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-white/40">
      {children}
    </div>
  );
}
