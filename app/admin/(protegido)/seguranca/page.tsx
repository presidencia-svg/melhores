import { Card, CardContent } from "@/components/ui/Card";
import {
  generateNewSecret,
  tenantTemTotp,
} from "@/lib/admin/totp";
import { getCurrentTenant } from "@/lib/tenant/resolver";
import QRCode from "qrcode";
import { ShieldCheck, Smartphone, KeyRound } from "lucide-react";
import {
  AtivarTotpForm,
  DesativarTotpButton,
  TrocarSenhaForm,
} from "./SegurancaForms";

export const dynamic = "force-dynamic";

export default async function SegurancaPage() {
  const tenant = await getCurrentTenant();
  const habilitado = tenantTemTotp(tenant);

  // Gera secret efemero pra usuario escanear. So persiste em
  // tenants.admin_totp_secret se ele confirmar com codigo valido.
  const novo = !habilitado ? generateNewSecret(tenant) : null;
  const qrDataUrl = novo ? await QRCode.toDataURL(novo.otpauthUrl) : null;

  // Detecta se o tenant ja migrou pro hash no banco. Se nao, sinaliza pra
  // ele trocar (ai gravamos o hash) e o env vira fallback so de emergencia.
  const senhaHashPresente = Boolean(tenant.admin_password_hash);

  return (
    <div className="p-8">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold text-cdl-blue">
          Segurança
        </h1>
        <p className="text-muted mt-1">
          Configurações de autenticação do painel administrativo de{" "}
          <strong>{tenant.nome}</strong>.
        </p>
      </header>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* 2FA status + ativacao */}
        <Card>
          <CardContent>
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  habilitado
                    ? "bg-cdl-green/15 text-cdl-green-dark"
                    : "bg-orange-100 text-orange-600"
                }`}
              >
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-cdl-blue">
                  Autenticação em 2 fatores (2FA)
                </h2>
                <p
                  className={`text-sm font-medium ${
                    habilitado ? "text-cdl-green-dark" : "text-orange-600"
                  }`}
                >
                  {habilitado ? "✓ Ativada" : "⚠ Desativada"}
                </p>
              </div>
            </div>

            {habilitado ? (
              <>
                <p className="text-sm text-muted">
                  O login do painel exige senha + código de 6 dígitos do app
                  autenticador.
                </p>
                <DesativarTotpButton />
              </>
            ) : (
              <p className="text-sm text-muted">
                Sem 2FA, qualquer pessoa que descobrir a senha consegue acessar
                o painel. Recomendado ativar.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Setup do 2FA */}
        {!habilitado && novo && qrDataUrl && (
          <Card>
            <CardContent>
              <h3 className="font-display text-lg font-bold text-cdl-blue mb-3">
                Como ativar
              </h3>
              <ol className="list-decimal pl-5 space-y-2 text-sm text-foreground">
                <li>
                  Instale o <strong>Google Authenticator</strong> ou{" "}
                  <strong>Authy</strong> no seu celular.
                </li>
                <li>Escaneie o QR Code abaixo:</li>
                <li>
                  Digite o código de 6 dígitos que apareceu no app pra
                  confirmar.
                </li>
              </ol>

              <div className="mt-4 flex flex-col items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrDataUrl}
                  alt="QR Code 2FA"
                  className="w-48 h-48 border border-border rounded-lg"
                />
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

              <AtivarTotpForm secret={novo.secret} />
            </CardContent>
          </Card>
        )}

        {/* Trocar senha */}
        <Card className="lg:col-span-2">
          <CardContent>
            <div className="flex items-center gap-3 mb-3">
              <KeyRound className="w-5 h-5 text-cdl-blue" />
              <h3 className="font-display text-lg font-bold text-cdl-blue">
                Senha do painel
              </h3>
            </div>
            {!senhaHashPresente ? (
              <p className="text-xs text-orange-600 mb-3">
                ⚠ Senha ainda no formato antigo (env). Trocar agora migra pra
                hash criptografada no banco — recomendado.
              </p>
            ) : (
              <p className="text-sm text-muted mb-3">
                Use uma senha forte e única (8+ caracteres). Não compartilhe.
              </p>
            )}
            <TrocarSenhaForm />
          </CardContent>
        </Card>

        {/* Dispositivos */}
        <Card className="lg:col-span-2">
          <CardContent>
            <div className="flex items-center gap-3 mb-3">
              <Smartphone className="w-5 h-5 text-cdl-blue" />
              <h3 className="font-display text-lg font-bold text-cdl-blue">
                Dispositivos admin
              </h3>
            </div>
            <p className="text-sm text-muted">
              Use o painel apenas em dispositivos próprios da {tenant.nome}. Se
              desconfiar de acesso indevido, troque a senha agora e ative 2FA.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
