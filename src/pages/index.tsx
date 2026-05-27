import Head from 'next/head';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import HeroMockup from '@/components/HeroMockup';
import { calculateDataQuality, getScoreColor } from '@/lib/scoring';
import { SAMPLE_TEMPLATES } from '@/lib/samples';
import type { PassportRecord } from '@/lib/types';

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const CREATES = [
  {
    title: 'Public product passport page',
    desc: 'A clean, public URL showing all product transparency data — materials, origin, care, safety, recycling, and warranty.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
    ),
  },
  {
    title: 'QR code and label',
    desc: 'Download a QR code image that opens the passport page. Attach it to product tags, packaging, or documentation.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="3" height="3"/><line x1="21" y1="14" x2="21" y2="14.01"/><line x1="21" y1="21" x2="21" y2="21.01"/><line x1="17" y1="21" x2="17" y2="21.01"/></svg>
    ),
  },
  {
    title: 'PDF product data sheet',
    desc: 'Generate a professional A4 product data sheet with all passport information, ready for printing or sharing.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
    ),
  },
  {
    title: 'Missing-data checklist',
    desc: 'See which transparency fields are complete and which need attention — organized by regulatory area.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
    ),
  },
  {
    title: 'JSON export for structured data',
    desc: 'Export passport data as structured JSON for integration with other tools, marketplaces, or compliance systems.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
    ),
  },
];

const STEPS = [
  { num: '1', title: 'Enter product data', desc: 'Fill in brand, materials, origin, care, safety, and circularity information using the guided form.' },
  { num: '2', title: 'Review missing fields', desc: 'See your data completeness score and a checklist of missing transparency information.' },
  { num: '3', title: 'Publish passport', desc: 'Save your passport and get a public URL that anyone can visit.' },
  { num: '4', title: 'Attach QR to tag or packaging', desc: 'Download a QR code, print a label, and attach it to your product packaging or hang tag.' },
];

const CHECKLIST_ITEMS = [
  { label: 'Product identity', desc: 'Name, brand, SKU, model, category' },
  { label: 'Materials & composition', desc: 'Material list, composition, recycled content' },
  { label: 'Origin & traceability', desc: 'Country, manufacturer, supplier' },
  { label: 'Manufacturer / contact', desc: 'Manufacturer info, responsible person' },
  { label: 'Care & safety', desc: 'Care instructions, safety warnings' },
  { label: 'Repair & recycling', desc: 'Repair info, recycling, end-of-life' },
  { label: 'Warranty & support', desc: 'Warranty terms, support email' },
  { label: 'Last updated date', desc: 'Data freshness indicator' },
];

const PRICING = [
  {
    name: 'Free Sample',
    price: '$0',
    sub: '',
    features: ['1 sample passport', 'Watermark on public page', 'QR code preview', 'Demo use only'],
    cta: 'Create sample',
    href: '/generator',
    highlight: false,
  },
  {
    name: 'Starter Passport',
    price: '$29',
    sub: 'one-time',
    features: ['1 public passport', 'QR code download', 'PDF product data sheet', '12-month hosted page'],
    cta: 'Buy on Gumroad',
    href: '#',
    highlight: true,
  },
  {
    name: 'Brand Starter Pack',
    price: '$79',
    sub: 'one-time',
    features: ['Up to 5 product passports', 'QR label pack', 'Brand template', 'Missing-data report'],
    cta: 'Buy on Gumroad',
    href: '#',
    highlight: false,
  },
  {
    name: 'Done-for-you Setup',
    price: '$199',
    sub: 'one-time',
    features: ['Up to 10 products', 'Custom setup', 'Missing-data report', 'Priority support'],
    cta: 'Request setup',
    href: '#',
    highlight: false,
  },
];

/* Example passport cards — first 3 samples */
const EXAMPLE_SAMPLES = SAMPLE_TEMPLATES.slice(0, 3);

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function LandingPage() {
  return (
    <>
      <Head>
        <title>PassportKit — QR Product Passports for Small Brands</title>
        <meta name="description" content="Create QR product passports for small brands. Organize product materials, origin, care, safety, repair, recycling, and warranty information into public QR-accessible product passport pages." />
      </Head>

      <Navbar />

      <main className="pt-14">
        {/* ===== HERO ===== */}
        <section className="py-20 md:py-28 lg:py-32 px-5">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left: Copy */}
              <div className="max-w-xl">
                <h1 className="text-3xl sm:text-4xl md:text-[2.75rem] font-extrabold leading-[1.15] text-[var(--color-text)] mb-5 animate-fade-up tracking-tight text-balance">
                  QR product passports for small&nbsp;brands.
                </h1>
                <p className="text-base md:text-[1.075rem] text-[var(--color-text-muted)] mb-3 animate-fade-up delay-100 leading-relaxed">
                  Organize product materials, origin, care, safety, repair, recycling, and warranty information into a public QR-accessible product passport.
                </p>
                <div className="flex flex-col sm:flex-row items-start gap-3 mt-8 animate-fade-up delay-200">
                  <Link href="/generator" className="btn-primary no-underline">
                    Create a sample passport
                  </Link>
                  <Link href="/sample" className="btn-secondary no-underline">
                    View example
                  </Link>
                </div>
                <p className="text-xs text-[var(--color-text-dim)] mt-6 animate-fade-up delay-300 leading-relaxed">
                  DPP-readiness tool. Not legal advice. No compliance certification claims.
                </p>
              </div>

              {/* Right: Mockup */}
              <div className="animate-fade-up delay-300 hidden md:block">
                <HeroMockup />
              </div>
            </div>
          </div>
        </section>

        {/* ===== PROBLEM SECTION ===== */}
        <section className="py-16 md:py-20 px-5 bg-[var(--color-surface)]">
          <div className="max-w-3xl mx-auto">
            <p className="section-label">The shift</p>
            <h2 className="text-2xl md:text-3xl font-bold mb-6 tracking-tight text-balance">
              Product data is becoming part of the product.
            </h2>
            <div className="space-y-4 text-[var(--color-text-muted)] leading-relaxed">
              <p>
                Materials and origin data are scattered across spreadsheets, supplier emails, and product pages. Safety, care, repair, and recycling information is often incomplete or missing entirely.
              </p>
              <p>
                Small brands need a simple way to prepare product transparency pages before regulatory requirements become urgent — and to use transparent product information as a trust-building tool with customers.
              </p>
            </div>
          </div>
        </section>

        {/* ===== WHAT PASSPORTKIT CREATES ===== */}
        <section className="py-16 md:py-20 px-5">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <p className="section-label">What PassportKit creates</p>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-balance">
                Everything you need for product transparency.
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {CREATES.map((item) => (
                <div key={item.title} className="card card-interactive p-6">
                  <div className="w-10 h-10 rounded-lg bg-[var(--color-accent-bg)] flex items-center justify-center text-[var(--color-accent)] mb-4">
                    {item.icon}
                  </div>
                  <h3 className="font-semibold text-[var(--color-text)] mb-2 text-[0.95rem]">{item.title}</h3>
                  <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== EXAMPLE PASSPORTS ===== */}
        <section className="py-16 md:py-20 px-5 bg-[var(--color-surface)]">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <p className="section-label">Examples</p>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-balance">
                See what a product passport looks like.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {EXAMPLE_SAMPLES.map((tpl) => {
                const q = calculateDataQuality({ ...tpl.data, slug: '', edit_token: '' } as PassportRecord);
                return (
                  <div key={tpl.id} className="card card-interactive p-6 flex flex-col">
                    {/* Product image placeholder */}
                    <div className="product-image-placeholder h-32 rounded-lg mb-4 relative">
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-[var(--color-text-dim)]">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                          <circle cx="8.5" cy="8.5" r="1.5"/>
                          <polyline points="21 15 16 10 5 21"/>
                        </svg>
                        <span className="text-[10px] text-[var(--color-text-dim)]">Product image</span>
                      </div>
                    </div>

                    <span className="badge badge-neutral self-start mb-2">{tpl.data.category}</span>
                    <h3 className="font-bold text-[var(--color-text)] mb-0.5">{tpl.data.product_name}</h3>
                    <p className="text-sm text-[var(--color-text-muted)] mb-3">by {tpl.data.brand_name}</p>

                    {/* Data completeness */}
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex-1">
                        <div className="score-bar">
                          <div className="score-bar-fill" style={{ width: `${q.score}%`, backgroundColor: getScoreColor(q.level) }} />
                        </div>
                      </div>
                      <span className="text-xs font-semibold" style={{ color: getScoreColor(q.level) }}>
                        {q.score}%
                      </span>
                    </div>

                    {/* QR Preview */}
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[var(--color-surface-alt)] mb-4">
                      <div className="bg-white p-1 rounded border border-[var(--color-border-light)]">
                        <QRCodeSVG value={`https://passportkit.com/p/${tpl.id}`} size={24} bgColor="#ffffff" fgColor="#111111" level="M" />
                      </div>
                      <span className="text-[10px] text-[var(--color-text-dim)]">QR preview</span>
                    </div>

                    <Link href={`/generator?sample=${tpl.id}`} className="btn-secondary btn-sm text-center no-underline w-full mt-auto">
                      View sample
                    </Link>
                  </div>
                );
              })}
            </div>

            <div className="text-center mt-8">
              <Link href="/sample" className="btn-ghost no-underline">
                View all examples →
              </Link>
            </div>
          </div>
        </section>

        {/* ===== HOW IT WORKS ===== */}
        <section className="py-16 md:py-20 px-5">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <p className="section-label">How it works</p>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                Four simple steps.
              </h2>
            </div>

            <div className="space-y-8">
              {STEPS.map((s, i) => (
                <div key={s.num} className={`flex gap-5 items-start animate-fade-up delay-${(i + 1) * 100}`}>
                  <div className="step-dot step-dot-active shrink-0 mt-0.5">{s.num}</div>
                  <div>
                    <h3 className="font-semibold text-[var(--color-text)] mb-1.5 text-[1.025rem]">{s.title}</h3>
                    <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== READINESS CHECKLIST ===== */}
        <section className="py-16 md:py-20 px-5 bg-[var(--color-surface)]">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <p className="section-label">Readiness checklist</p>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-balance">
                What a well-prepared product passport covers.
              </h2>
            </div>

            <div className="card p-6 md:p-8">
              <div className="space-y-0">
                {CHECKLIST_ITEMS.map((item, i) => (
                  <div key={item.label} className={`flex items-start gap-3 py-3.5 ${i < CHECKLIST_ITEMS.length - 1 ? 'border-b border-[var(--color-border-light)]' : ''}`}>
                    <div className="w-5 h-5 rounded border-2 border-[var(--color-accent)] flex items-center justify-center shrink-0 mt-0.5">
                      <svg width="12" height="12" viewBox="0 0 20 20" fill="var(--color-accent)">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--color-text)] text-sm">{item.label}</p>
                      <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 text-center">
                <Link href="/docs/checklist" className="btn-ghost no-underline">
                  View full checklist →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ===== PRICING ===== */}
        <section id="pricing" className="py-16 md:py-20 px-5">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <p className="section-label">Pricing</p>
              <h2 className="text-2xl md:text-3xl font-bold mb-3 tracking-tight">
                Simple, transparent pricing.
              </h2>
              <p className="text-[var(--color-text-muted)] max-w-lg mx-auto">
                No subscriptions. No hidden fees. Start free, upgrade when ready.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {PRICING.map((p) => (
                <div key={p.name} className={`pricing-card ${p.highlight ? 'pricing-card-featured' : ''}`}>
                  {p.highlight && (
                    <span className="badge badge-green self-start mb-3">Most popular</span>
                  )}
                  <h3 className="font-bold text-[var(--color-text)] text-[1.05rem]">{p.name}</h3>
                  <div className="mt-3 mb-5">
                    <span className="text-3xl font-extrabold text-[var(--color-text)] tracking-tight">{p.price}</span>
                    {p.sub && <span className="text-sm text-[var(--color-text-dim)] ml-1.5">{p.sub}</span>}
                  </div>
                  <ul className="space-y-2.5 mb-8 flex-1">
                    {p.features.map((f) => (
                      <li key={f} className="text-sm text-[var(--color-text-muted)] flex items-start gap-2.5">
                        <svg className="w-4 h-4 text-[var(--color-accent)] shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                  {p.href === '/generator' ? (
                    <Link href={p.href} className={`${p.highlight ? 'btn-primary' : 'btn-secondary'} text-center no-underline w-full`}>
                      {p.cta}
                    </Link>
                  ) : (
                    <button className="btn-secondary w-full opacity-60 cursor-not-allowed" disabled>
                      {p.cta}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== DISCLAIMER ===== */}
        <section className="py-14 px-5 bg-[var(--color-surface)]">
          <div className="max-w-3xl mx-auto">
            <div className="disclaimer-box">
              <p className="font-semibold text-[var(--color-text-secondary)] mb-2 text-sm">Disclaimer</p>
              <p>
                PassportKit is a product transparency and DPP-readiness tool. It helps brands organize and publish product information through QR-accessible product passport pages. PassportKit is not legal advice, does not certify regulatory compliance, and does not replace guidance from qualified legal, product safety, or compliance professionals.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
