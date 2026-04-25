import { Logo } from "@/components/brand/Logo";
import { StepIndicator } from "@/components/voto/StepIndicator";
import Link from "next/link";

type VotoLayoutProps = {
  step: 1 | 2 | 3 | 4;
  children: React.ReactNode;
};

export function VotoLayout({ step, children }: VotoLayoutProps) {
  return (
    <div className="flex flex-col flex-1 min-h-screen bg-gradient-to-b from-cdl-blue/5 to-background">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/">
            <Logo />
          </Link>
          <span className="text-xs font-semibold uppercase tracking-wider text-cdl-blue">
            Melhores do Ano 2026
          </span>
        </div>
      </header>

      <div className="px-4 py-6">
        <StepIndicator current={step} />
      </div>

      <main className="flex-1 px-4 pb-12">{children}</main>
    </div>
  );
}
