import { Logo } from "@/components/brand/Logo";
import { StepIndicator } from "@/components/voto/StepIndicator";
import { SmallCaps } from "@/components/brand/Marks";
import Link from "next/link";

type VotoLayoutProps = {
  step: 1 | 2 | 3 | 4;
  children: React.ReactNode;
};

export function VotoLayout({ step, children }: VotoLayoutProps) {
  return (
    <div className="flex flex-col flex-1 min-h-screen bg-cream-300">
      <header className="border-b border-[rgba(10,42,94,0.12)] bg-cream-100/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link href="/">
            <Logo />
          </Link>
          <SmallCaps color="var(--gold-700)" size={10}>
            edição 2026
          </SmallCaps>
        </div>
      </header>

      <div className="px-6 py-6 border-b border-[rgba(10,42,94,0.06)]">
        <StepIndicator current={step} />
      </div>

      <main className="flex-1 px-6 pb-16">{children}</main>
    </div>
  );
}
