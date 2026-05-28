# PassportKit Setup

This guide keeps setup repeatable without storing secrets in the repository.

## 1. Environment

Copy `.env.example` to `.env.local`, then fill in real values from Supabase and optional integrations.

Required for core passport creation:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional integrations:

- Stripe: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_BRAND`, `STRIPE_PRICE_PRO`
- Shopify: `SHOPIFY_CLIENT_ID`, `SHOPIFY_CLIENT_SECRET`, `SHOPIFY_SCOPES`, `SHOPIFY_APP_URL`
- OpenAI: `OPENAI_API_KEY`
- Resend: `RESEND_API_KEY`, `EMAIL_FROM`

Run:

```bash
npm run check:env
npm run dev:doctor
```

These commands never print secret values.

## 2. Supabase SQL

Run these files in Supabase SQL Editor, in order:

1. `supabase/setup_all.sql`
2. `supabase/rls_policies.sql`
3. `supabase/storage.sql`

For existing users created before workspaces were stable, run:

4. `supabase/repair_user_workspace.sql`

For local-only demo content, optionally run:

5. `supabase/dev_seed.sql`

## 3. Verify

Run:

```bash
npm run build
npm run dev
```

Open `/admin/setup` to confirm configured/missing service groups.

## 4. Core Smoke Test

Guest flow:

- Log out or use incognito.
- Create a passport from `/generator`.
- Open `/p/[slug]`.
- Open `/edit/[slug]?token=...`.

Logged-in flow:

- Sign up or log in.
- Confirm dashboard shows plan usage for the current workspace.
- Create the first passport.
- Confirm `/dashboard/passports` shows it.
- Open `/p/[slug]` while logged out/incognito.
- Confirm the second free-plan passport is blocked.

## 5. Troubleshooting

If creation shows `Supabase server API key is invalid or expired`, replace `SUPABASE_SERVICE_ROLE_KEY` with the service role key from the same Supabase project as `NEXT_PUBLIC_SUPABASE_URL`.

If public passport pages return not found for published public rows, run `supabase/rls_policies.sql` and confirm the row has `status = 'published'` and `visibility = 'public'`.
