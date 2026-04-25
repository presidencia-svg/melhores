"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Check, X } from "lucide-react";

type Sugestao = {
  id: string;
  nome: string;
  sugestoes_count: number;
  criado_em: string;
  subcategoria: { nome: string; categoria: { nome: string } };
};

export function SugestoesManager({ sugestoes }: { sugestoes: Sugestao[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function decidir(id: string, decisao: "aprovado" | "rejeitado") {
    setLoading(id);
    await fetch(`/api/admin/candidatos/${id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: decisao }),
    });
    setLoading(null);
    router.refresh();
  }

  if (sugestoes.length === 0) {
    return <p className="text-center text-muted py-12">Nenhuma sugestão pendente. 🎉</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {sugestoes.map((s) => (
        <Card key={s.id}>
          <CardContent className="flex items-center gap-3">
            <div className="flex-1">
              <div className="font-semibold text-foreground">{s.nome}</div>
              <div className="text-xs text-muted">
                {s.subcategoria.categoria.nome} → {s.subcategoria.nome} ·
                <span className="ml-1 inline-flex items-center gap-1 text-cdl-blue font-semibold">
                  {s.sugestoes_count} sugestões
                </span>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => decidir(s.id, "aprovado")}
              loading={loading === s.id}
            >
              <Check className="w-4 h-4" /> Aprovar
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => decidir(s.id, "rejeitado")}
              loading={loading === s.id}
            >
              <X className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
