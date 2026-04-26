import { Card, CardContent } from "@/components/ui/Card";
import { isTotpEnabled, generateNewSecret } from "@/lib/admin/totp";
import QRCode from "qrcode";
import { ShieldCheck, Smartphone } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SegurancaPage() {
  const habilitado = isTotpEnabled();

  // Gera novo secret + QR sob demanda (não persiste — admin precisa adicionar ao .env)
  const novo = !habilitado ? generateNewSecret() : null;
  const qrDataUrl = novo ? await QRCode.toDataURL(novo.otpauthUrl) : null;

  return (
    <div className="p-8">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold text-cdl-blue">Segurança</h1>
        <p className="text-muted mt-1">Configurações de autenticação do painel administrativo.</p>
      </header>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardContent>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${habilitado ? "bg-cdl-green/15 text-cdl-green-dark" : "bg-orange-100 text-orange-600"}`}>
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-cdl-blue">Autenticação em 2 fatores (2FA)</h2>
                <p className={`text-sm font-medium ${habilitado ? "text-cdl-green-dark" : "text-orange-600"}`}>
                  {habilitado ? "✓ Ativada" : "⚠ Desativada"}
                </p>
              </div>
            </div>

            {habilitado ? (
              <p className="text-sm text-muted">
                O login do painel exige senha + código de 6 dígitos do Google Authenticator.
              </p>
            ) : (
              <p className="text-sm text-muted">
                Sem 2FA, qualquer pessoa que descobrir a senha consegue acessar o painel. Recomendado ativar.
              </p>
            )}
          </CardContent>
        </Card>

        {!habilitado && novo && qrDataUrl && (
          <Card>
            <CardContent>
              <h3 className="font-display text-lg font-bold text-cdl-blue mb-3">Como ativar</h3>
              <ol className="list-decimal pl-5 space-y-2 text-sm text-foreground">
                <li>
                  Instale o <strong>Google Authenticator</strong> ou <strong>Authy</strong> no seu celular.
                </li>
                <li>Escaneie o QR Code abaixo:</li>
                <li>
                  Adicione esta variável ao <code>.env.local</code> (e na Vercel) e faça redeploy:
                  <pre className="mt-2 bg-zinc-50 border border-border rounded p-3 text-xs overflow-x-auto select-all">
{`ADMIN_TOTP_SECRET=${novo.secret}`}
                  </pre>
                </li>
                <li>Faça logout e login novamente — vai pedir o código de 6 dígitos.</li>
              </ol>

              <div className="mt-4 flex flex-col items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrDataUrl} alt="QR Code 2FA" className="w-48 h-48 border border-border rounded-lg" />
                <p className="text-xs text-muted">Escaneie no app autenticador</p>
              </div>

              <details className="mt-4">
                <summary className="text-xs text-cdl-blue cursor-pointer hover:underline">
                  Não consegue escanear? Inserir código manualmente
                </summary>
                <pre className="mt-2 bg-zinc-50 border border-border rounded p-2 text-xs select-all">
{novo.secret}
                </pre>
              </details>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent>
            <div className="flex items-center gap-3 mb-3">
              <Smartphone className="w-5 h-5 text-cdl-blue" />
              <h3 className="font-display text-lg font-bold text-cdl-blue">Dispositivos admin</h3>
            </div>
            <p className="text-sm text-muted">
              Use o painel apenas em dispositivos próprios da CDL. Se desconfiar de acesso indevido, troque a
              <code className="bg-zinc-100 px-1 rounded mx-1">ADMIN_PASSWORD</code> no <code className="bg-zinc-100 px-1 rounded">.env.local</code> e refaça o deploy.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
