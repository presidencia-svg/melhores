import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { Logo } from "@/components/brand/Logo";
import { CadastroForm } from "./CadastroForm";

export const metadata = {
  title: "Criar conta — Melhores do Ano",
  description:
    "Cadastre sua CDL ou organização e receba o sistema de votação dos Melhores do Ano em até 24h.",
};

export default function CadastrarPage() {
  return (
    <div className="flex flex-col flex-1 min-h-screen bg-gradient-to-b from-cdl-blue/5 to-background px-4 py-10">
      <div className="w-full max-w-xl mx-auto animate-fade-in">
        <div className="flex justify-center mb-6">
          <Logo />
        </div>

        <Card>
          <CardContent>
            <h1 className="font-display text-3xl font-bold text-cdl-blue mb-1 text-center">
              Crie sua conta
            </h1>
            <p className="text-sm text-muted text-center mb-6">
              Comece com 14 dias de avaliação. Sem cartão.
            </p>
            <CadastroForm />
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted mt-6">
          Já tem conta?{" "}
          <Link href="/admin/login" className="text-cdl-blue hover:underline">
            Entrar no painel
          </Link>
        </p>
      </div>
    </div>
  );
}
