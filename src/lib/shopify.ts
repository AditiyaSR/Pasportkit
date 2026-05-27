import crypto from 'crypto';

export function getShopifyConfig() {
  return {
    clientId: process.env.SHOPIFY_CLIENT_ID,
    clientSecret: process.env.SHOPIFY_CLIENT_SECRET,
    scopes: process.env.SHOPIFY_SCOPES || 'read_products,write_products,write_metafields',
    appUrl: process.env.SHOPIFY_APP_URL || process.env.NEXT_PUBLIC_SITE_URL
  };
}

export function isShopifyConfigured(): boolean {
  const config = getShopifyConfig();
  return !!(config.clientId && config.clientSecret && config.appUrl);
}

export function verifyShopifyHmac(query: Record<string, any>): boolean {
  const { hmac, ...rest } = query;
  if (!hmac || !process.env.SHOPIFY_CLIENT_SECRET) return false;

  const queryString = Object.keys(rest)
    .sort()
    .map(key => `${key}=${rest[key]}`)
    .join('&');

  const hash = crypto
    .createHmac('sha256', process.env.SHOPIFY_CLIENT_SECRET)
    .update(queryString)
    .digest('hex');

  return hash === hmac;
}
