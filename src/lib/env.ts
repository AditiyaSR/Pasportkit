type EnvStatus = {
  configured: boolean;
  missing: string[];
};

export type ServerEnvStatus = {
  core: EnvStatus;
  supabase: EnvStatus;
  supabaseService: EnvStatus;
  stripe: EnvStatus;
  shopify: EnvStatus;
  ai: EnvStatus;
  email: EnvStatus;
};

export type ClientEnvStatus = {
  supabase: EnvStatus;
  site: EnvStatus;
};

function hasEnv(name: string): boolean {
  const value = process.env[name];
  return typeof value === 'string' && value.trim().length > 0;
}

function statusFor(names: string[]): EnvStatus {
  const missing = names.filter((name) => !hasEnv(name));
  return {
    configured: missing.length === 0,
    missing,
  };
}

export function getClientEnvStatus(): ClientEnvStatus {
  return {
    supabase: statusFor(['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY']),
    site: statusFor(['NEXT_PUBLIC_SITE_URL']),
  };
}

export function getServerEnvStatus(): ServerEnvStatus {
  const supabase = statusFor(['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY']);
  const supabaseService = statusFor(['SUPABASE_SERVICE_ROLE_KEY']);

  return {
    core: statusFor([
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'NEXT_PUBLIC_SITE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
    ]),
    supabase,
    supabaseService,
    stripe: statusFor([
      'STRIPE_SECRET_KEY',
      'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'STRIPE_PRICE_STARTER',
      'STRIPE_PRICE_BRAND',
      'STRIPE_PRICE_PRO',
    ]),
    shopify: statusFor(['SHOPIFY_CLIENT_ID', 'SHOPIFY_CLIENT_SECRET', 'SHOPIFY_SCOPES', 'SHOPIFY_APP_URL']),
    ai: statusFor(['OPENAI_API_KEY']),
    email: statusFor(['RESEND_API_KEY', 'EMAIL_FROM']),
  };
}

export function requireServerEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function isSupabaseServiceConfigured(): boolean {
  return getServerEnvStatus().supabaseService.configured;
}

export function isStripeConfigured(): boolean {
  return getServerEnvStatus().stripe.configured;
}

export function isShopifyConfigured(): boolean {
  return getServerEnvStatus().shopify.configured;
}

export function isAIConfigured(): boolean {
  return getServerEnvStatus().ai.configured;
}

export function isEmailConfigured(): boolean {
  return getServerEnvStatus().email.configured;
}
