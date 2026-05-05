export type Tenant = {
  id: string;
  slug: string;
  nome: string;
  cnpj: string | null;
  dominio: string | null;
  ativo: boolean;

  logo_url: string | null;
  cor_primaria: string | null;
  cor_secundaria: string | null;

  meta_phone_number_id: string | null;
  meta_template_otp: string | null;
  meta_template_incentivo: string | null;
  meta_template_incentivo_empate: string | null;
  meta_template_parcial: string | null;
  meta_template_lang: string | null;

  zapi_instance_id: string | null;
  zapi_token: string | null;
  zapi_client_token: string | null;

  instagram_page_access_token: string | null;
  instagram_business_account_id: string | null;
  instagram_facebook_page_id: string | null;
  instagram_username: string | null;

  admin_password_hash: string | null;
  admin_totp_secret: string | null;
  admin_email: string | null;

  plano: "starter" | "pro" | "business" | null;
  trial_ate: string | null;
  criada_via: "manual" | "signup" | null;

  criado_em: string;
  atualizado_em: string;
};

export const TENANT_COLUNAS = `
  id, slug, nome, cnpj, dominio, ativo,
  logo_url, cor_primaria, cor_secundaria,
  meta_phone_number_id, meta_template_otp, meta_template_incentivo,
  meta_template_incentivo_empate, meta_template_parcial, meta_template_lang,
  zapi_instance_id, zapi_token, zapi_client_token,
  instagram_page_access_token, instagram_business_account_id,
  instagram_facebook_page_id, instagram_username,
  admin_password_hash, admin_totp_secret, admin_email,
  plano, trial_ate, criada_via, criado_em, atualizado_em
`.replace(/\s+/g, " ").trim();
