import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Logo } from "@/components/brand/Logo";
import { isAdmin } from "@/lib/admin/auth";
import { isTotpEnabled } from "@/lib/admin/totp";
import { LoginForm } from "./LoginForm";

export default async function AdminLoginPage() {
  if (await isAdmin()) redirect("/admin");
  const totp = isTotpEnabled();

  return (
    <div className="flex flex-col flex-1 min-h-screen items-center justify-center bg-gradient-to-b from-cdl-blue/5 to-background px-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="flex justify-center mb-6">
          <Logo />
        </div>
        <Card>
          <CardContent>
            <h1 className="font-display text-2xl font-bold text-cdl-blue mb-1 text-center">
              Painel Administrativo
            </h1>
            <p className="text-sm text-muted text-center mb-6">
              {totp ? "Senha + código do Google Authenticator" : "Acesso restrito à equipe CDL"}
            </p>
            <LoginForm totpEnabled={totp} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
