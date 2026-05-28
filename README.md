# PassportKit

**Create QR product passports for small brands before transparency requirements become urgent.**

PassportKit helps small brands organize product data, create QR-accessible product passport pages, and spot missing transparency information — without claiming legal certification.

> **Disclaimer:** PassportKit is a product transparency and DPP-readiness tool. It is not legal advice, does not certify regulatory compliance, and does not replace guidance from qualified professionals.

## Features

- **Multi-step generator form** — 8-step form covering product identity, materials, origin, care/safety, circularity, warranty, and regulatory readiness
- **Public passport page** — `/p/[slug]` — beautiful, shareable product passport pages
- **QR code** — scannable QR code linking to the public passport URL
- **QR label download** — downloadable QR as PNG for printing
- **PDF data sheet** — clean A4 PDF download
- **JSON export** — structured JSON export for data portability
- **Data quality score** — 0–100 scoring with missing data checklist
- **Regulatory readiness checklists** — educational checklists for DPP, GPSR, textile labelling, REACH, PPWR, EUDR
- **Category-based modules** — auto-detected from product category (textile, leather, furniture, homeware, electronics, battery)
- **Sample templates** — 5 pre-filled templates (organic cotton tee, leather bag, wooden stool, ceramic mug, linen pillow cover)
- **Edit flow** — update passports via private edit link with token (no login required)
- **Watermark** — demo passports show a watermark badge
- **Safe disclaimers** — legal disclaimer on all pages

## Tech Stack

- Next.js 16 (Pages Router) + TypeScript
- Tailwind CSS v4
- Supabase (Postgres + RLS)
- qrcode.react
- html2canvas + jsPDF
- nanoid (slug/token generation)
- date-fns

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env.local` and fill in real values. Do not commit `.env.local`.

Core passport creation requires:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Check setup without printing secrets:

```bash
npm run check:env
npm run dev:doctor
```

### 3. Configure Supabase

Create a Supabase project, then run these files in Supabase SQL Editor:

1. `supabase/setup_all.sql`
2. `supabase/rls_policies.sql`
3. `supabase/storage.sql`

For users created before workspace setup was stable, run `supabase/repair_user_workspace.sql`.

Optional local demo data is in `supabase/dev_seed.sql`.

Open `/admin/setup` locally to see configured/missing services without exposing secret values.

### 4. Run locally

```bash
npm run dev
```

Open http://localhost:3000

## How to Test

1. **Create passport** — Go to `/generator`, fill in data or load a sample, click "Publish public passport"
2. **View public page** — Open `/p/[slug]` — verify all data renders correctly
3. **Refresh** — Refresh the public page — data should persist (loaded from Supabase)
4. **Incognito** — Open the URL in an incognito window — should work without context
5. **QR scan** — Scan the QR code from your phone — should open the public passport page
6. **Download QR** — Click "Download QR" — get a PNG file
7. **Print** — Click "Print" — clean print layout
8. **Download PDF** — Click "Download PDF" — get an A4 PDF data sheet
9. **Export JSON** — Click "Export JSON" — get a structured JSON file
10. **Edit** — Use the edit link (shown after creation) — update data and save
11. **Samples** — Go to `/sample` — browse example passports
12. **Checklist** — Go to `/docs/checklist` — view regulatory readiness checklist

## SQL Schema

Use `supabase/setup_all.sql` for a full idempotent setup, `supabase/rls_policies.sql` for policies, and `supabase/storage.sql` for product image storage. `supabase/schema.sql` is kept as the original base schema reference.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Base URL for QR codes (default: http://localhost:3000) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-only Supabase service role key |
| `STRIPE_SECRET_KEY` | Optional | Server-only Stripe secret key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Optional | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | Optional | Stripe webhook signature secret |
| `STRIPE_PRICE_STARTER` / `STRIPE_PRICE_BRAND` / `STRIPE_PRICE_PRO` | Optional | Stripe recurring price IDs |
| `SHOPIFY_CLIENT_ID` / `SHOPIFY_CLIENT_SECRET` / `SHOPIFY_SCOPES` / `SHOPIFY_APP_URL` | Optional | Shopify OAuth configuration |
| `OPENAI_API_KEY` | Optional | AI suggestion API key |
| `RESEND_API_KEY` / `EMAIL_FROM` | Optional | Email automation configuration |

## Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Set environment variables in the Vercel dashboard. Server-only keys must not be prefixed with `NEXT_PUBLIC_`.

## What This MVP Does NOT Do

- ❌ No legal certification — does not certify EU or any regulatory compliance
- ❌ No official EU DPP registry integration
- ❌ No battery passport certification
- ❌ No CE conformity assessment
- ❌ No blockchain or official registry submission
- ❌ No external integrations without the required provider keys

## Attribution

Landing page structure adapted from [Tailwind Toolbox Landing Page](https://github.com/tailwindtoolbox/Landing-Page), MIT License.

## Project Structure

```
src/
├── components/          Navbar, Footer, HeroMockup, PassportPDFLayout
├── lib/
│   ├── types.ts         Core types and interfaces
│   ├── supabase.ts      Supabase client + URL helpers
│   ├── scoring.ts       Data quality scoring engine
│   ├── categories.ts    Category detection + checklists
│   ├── samples.ts       Sample passport templates
│   └── schema.ts        Zod validation schemas
├── pages/
│   ├── index.tsx         Landing page
│   ├── generator.tsx     Multi-step form
│   ├── sample.tsx        Sample gallery
│   ├── p/[slug].tsx      Public passport page
│   ├── edit/[slug].tsx   Edit page (token-protected)
│   ├── legal/disclaimer  Disclaimer page
│   ├── docs/checklist    Regulatory readiness checklist
│   └── api/passports/    API routes (create, read, update, export)
├── styles/globals.css    Design system
└── types/                Type declarations
supabase/
└── schema.sql            Database schema
```

## License

MIT
