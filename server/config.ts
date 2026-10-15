import dotenv from 'dotenv';

dotenv.config();

function requireProductionValue(name: string, minimumLength = 1): void {
  if (process.env.NODE_ENV !== 'production' && process.env.CONTEXT !== 'production') return;
  const value = process.env[name]?.trim() || '';
  if (value.length < minimumLength) {
    throw new Error(`${name} é obrigatório em produção`);
  }
}

export function validateRuntimeConfig(): void {
  requireProductionValue('ADMIN_SESSION_SECRET', 32);
  requireProductionValue('INFINITEPAY_HANDLE');

  if (process.env.NODE_ENV === 'production' || process.env.CONTEXT === 'production') {
    const configuredUrl = getAppUrl();
    if (!configuredUrl) {
      throw new Error('APP_URL é obrigatória em produção fora da Netlify');
    }
    const appUrl = new URL(configuredUrl);
    if (appUrl.protocol !== 'https:') {
      throw new Error('APP_URL deve usar HTTPS em produção');
    }
  }
}

export function getAppUrl(): string | undefined {
  const netlifyPreviewUrl = process.env.CONTEXT === 'deploy-preview' ? process.env.DEPLOY_PRIME_URL : undefined;
  const raw = (netlifyPreviewUrl || process.env.APP_URL || process.env.URL)?.trim();
  if (!raw) return undefined;
  try {
    return new URL(raw).origin;
  } catch {
    return undefined;
  }
}

validateRuntimeConfig();
