#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const envPath = path.join(root, '.env.local');

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const env = {};
  for (const rawLine of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const index = line.indexOf('=');
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim().replace(/^['"]|['"]$/g, '');
    env[key] = value;
  }
  return env;
}

const fileEnv = parseEnvFile(envPath);
const env = { ...fileEnv, ...process.env };

const groups = [
  {
    label: 'Core Supabase',
    required: true,
    keys: [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'NEXT_PUBLIC_SITE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
    ],
  },
  {
    label: 'Stripe',
    required: false,
    keys: [
      'STRIPE_SECRET_KEY',
      'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'STRIPE_PRICE_STARTER',
      'STRIPE_PRICE_BRAND',
      'STRIPE_PRICE_PRO',
    ],
  },
  {
    label: 'Shopify',
    required: false,
    keys: ['SHOPIFY_CLIENT_ID', 'SHOPIFY_CLIENT_SECRET', 'SHOPIFY_SCOPES', 'SHOPIFY_APP_URL'],
  },
  {
    label: 'OpenAI',
    required: false,
    keys: ['OPENAI_API_KEY'],
  },
  {
    label: 'Resend',
    required: false,
    keys: ['RESEND_API_KEY', 'EMAIL_FROM'],
  },
];

function isPresent(key) {
  return typeof env[key] === 'string' && env[key].trim().length > 0;
}

let hasRequiredMissing = false;

console.log('PassportKit environment check');
console.log('Secrets are not printed.\n');

for (const group of groups) {
  const missing = group.keys.filter((key) => !isPresent(key));
  const status = missing.length === 0 ? 'configured' : group.required ? 'missing required keys' : 'optional setup incomplete';
  console.log(`${group.label}: ${status}`);
  if (missing.length > 0) {
    console.log(`  Missing: ${missing.join(', ')}`);
  }
  if (group.required && missing.length > 0) {
    hasRequiredMissing = true;
  }
}

if (!fs.existsSync(envPath)) {
  console.log('\n.env.local was not found. Copy .env.example to .env.local and fill in your real keys.');
}

if (hasRequiredMissing) {
  process.exitCode = 1;
}
