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

### 2. Configure Supabase

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL schema in `supabase/schema.sql` in your Supabase SQL Editor
3. Copy `.env.example` to `.env.local` and fill in your credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

4. **Create Image Storage Bucket**:
   - In Supabase, go to Storage and create a new bucket named `product-images`.
   - Set the bucket to **Public** (this allows the product images to be viewed on the passport pages).
   - Under Configuration > Policies, create a new policy for the `product-images` bucket:
     - **Allowed operations:** `INSERT` (to allow uploads) and `SELECT` (to allow viewing)
     - **Target roles:** `anon`, `authenticated`
     - This allows anyone to upload product images (JPG, PNG, WEBP up to 5MB) from the generator without an account.
   - *Troubleshooting:* If images fail to upload or show up broken, verify that the bucket name is exactly `product-images`, it is set to Public, and the INSERT policy allows the `anon` role.

### 3. Run locally

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

See `supabase/schema.sql` for the complete database schema.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Base URL for QR codes (default: http://localhost:3000) |

## Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Set environment variables in the Vercel dashboard.

## What This MVP Does NOT Do

- ❌ No legal certification — does not certify EU or any regulatory compliance
- ❌ No login or user accounts
- ❌ No payment processing — pricing is placeholder CTAs
- ❌ No official EU DPP registry integration
- ❌ No Shopify or Etsy API integration
- ❌ No battery passport certification
- ❌ No CE conformity assessment
- ❌ No AI or blockchain
- ❌ No multi-tenant organizations
- ❌ No subscription billing

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
