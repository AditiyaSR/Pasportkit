import Head from 'next/head';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const STEPS = [
  { num: '1', title: 'Enter product data', desc: 'Fill in brand, materials, origin, care, safety, and circularity information using the guided form.' },
  { num: '2', title: 'Review missing fields', desc: 'See your data quality score and a checklist of missing transparency information.' },
  { num: '3', title: 'Publish public passport', desc: 'Save your passport and get a public URL that anyone can visit.' },
  { num: '4', title: 'Download QR label', desc: 'Download a QR code, print a label, and attach it to your product tag or packaging.' },
];

const USERS = [
  'Small fashion brands',
  'Handmade clothing',
  'Textile brands',
  'Accessories & leather goods',
  'Furniture makers',
  'Homeware brands',
  'Etsy & Shopify sellers',
  'Small DTC brands',
];

const GENERATES = [
  { icon: '📄', text: 'Public passport page' },
  { icon: '📱', text: 'QR code' },
  { icon: '🏷️', text: 'Printable QR label' },
  { icon: '📑', text: 'PDF product data sheet' },
  { icon: '✅', text: 'Missing-data checklist' },
  { icon: '📦', text: 'JSON export' },
];

const PRICING = [
  {
    name: 'Free Sample',
    price: '$0',
    sub: 'Try it out',
    features: ['1 sample passport', 'Watermark on public page', 'QR code download', 'Demo use only'],
    cta: 'Create free sample',
    href: '/generator',
    highlight: false,
  },
  {
    name: 'Starter Passport',
    price: '$29',
    sub: 'One-time',
    features: ['1 public passport', 'QR code + PDF data sheet', '12-month hosted page', 'No watermark'],
    cta: 'Buy on Gumroad',
    href: '#',
    highlight: true,
  },
  {
    name: 'Brand Starter Pack',
    price: '$79',
    sub: 'One-time',
    features: ['Up to 5 product passports', 'Brand template', 'QR labels for all products', 'Missing-data report'],
    cta: 'Buy on Gumroad',
    href: '#',
    highlight: false,
  },
  {
    name: 'Done-for-you Setup',
    price: '$199',
    sub: 'One-time',
    features: ['Up to 10 product passports', 'Custom setup by our team', 'Missing-data report', 'Priority support'],
    cta: 'Request setup',
    href: '#',
    highlight: false,
  },
];

export default function LandingPage() {
  return (
    <>
      <Head>
        <title>PassportKit — Create QR Product Passports for Small Brands</title>
        <meta name="description" content="Create QR product passports before transparency requirements become urgent. Organize product data, generate public passport pages, and spot missing transparency information." />
      </Head>

      <Navbar />

      <main className="pt-14">
        {/* ===== HERO ===== */}
        <section className="py-20 md:py-28 px-5">
          <div className="max-w-3xl mx-auto text-center">
            <p className="badge badge-green mb-6 animate-fade-in">Product transparency tool</p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight text-[var(--color-text)] mb-5 animate-fade-up tracking-tight">
              Create QR product passports before transparency requirements become&nbsp;urgent.
            </h1>
            <p className="text-base md:text-lg text-[var(--color-text-muted)] max-w-2xl mx-auto mb-4 animate-fade-up delay-100 leading-relaxed">
              PassportKit helps small brands organize product data, create QR-accessible product passport pages, and spot missing transparency information — without claiming legal certification.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8 animate-fade-up delay-200">
              <Link href="/generator" className="btn-primary no-underline">Create a sample passport</Link>
              <Link href="/sample" className="btn-secondary no-underline">View example passports</Link>
            </div>
          </div>
        </section>

        {/* ===== WHAT IS IT ===== */}
        <section className="py-16 px-5 bg-[var(--color-surface)]">
          <div className="max-w-3xl mx-auto">
            <p className="section-label">What is a QR product passport?</p>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">A public product information page, accessible via QR code.</h2>
            <p className="text-[var(--color-text-muted)] leading-relaxed mb-6">
              A QR product passport is a QR code attached to your product label or packaging that opens a public page showing product details: materials, origin, care instructions, safety information, repair and recycling options, warranty, and contact details.
            </p>
            <p className="text-[var(--color-text-muted)] leading-relaxed">
              It helps your customers access product information instantly and helps your brand organize transparency data in one place.
            </p>
          </div>
        </section>

        {/* ===== WHY PREPARE ===== */}
        <section className="py-16 px-5">
          <div className="max-w-3xl mx-auto">
            <p className="section-label">Why prepare early?</p>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Product transparency is becoming more important.</h2>
            <div className="space-y-4 text-[var(--color-text-muted)] leading-relaxed">
              <p>Digital Product Passport (DPP) requirements are developing under the EU Ecodesign for Sustainable Products Regulation (ESPR). While timelines and scope are still being defined, the direction is clear: more product categories will need structured transparency data.</p>
              <p>The General Product Safety Regulation (GPSR) already requires clear online product safety and manufacturer information for covered consumer products sold in the EU market.</p>
              <p>Small brands that organize their product data early will be better prepared when requirements become concrete — and can already use transparent product information as a trust-building tool with customers.</p>
            </div>
            <div className="disclaimer-box mt-6">
              <strong>Note:</strong> PassportKit does not provide legal advice and does not certify regulatory compliance. Consult qualified professionals for specific legal obligations.
            </div>
          </div>
        </section>

        {/* ===== WHO IS THIS FOR ===== */}
        <section className="py-16 px-5 bg-[var(--color-surface)]">
          <div className="max-w-4xl mx-auto">
            <p className="section-label text-center">Who is this for?</p>
            <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Built for small physical product brands.</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {USERS.map((u) => (
                <div key={u} className="card px-4 py-3 text-center">
                  <span className="text-sm font-medium text-[var(--color-text-secondary)]">{u}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== WHAT YOU CAN GENERATE ===== */}
        <section className="py-16 px-5">
          <div className="max-w-4xl mx-auto">
            <p className="section-label text-center">What you can generate</p>
            <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Everything you need for product transparency.</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {GENERATES.map((g) => (
                <div key={g.text} className="card p-5 flex items-start gap-3">
                  <span className="text-xl">{g.icon}</span>
                  <span className="text-sm font-medium text-[var(--color-text-secondary)]">{g.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== HOW IT WORKS ===== */}
        <section className="py-16 px-5 bg-[var(--color-surface)]">
          <div className="max-w-3xl mx-auto">
            <p className="section-label text-center">How it works</p>
            <h2 className="text-2xl md:text-3xl font-bold mb-10 text-center">Four simple steps.</h2>
            <div className="space-y-6">
              {STEPS.map((s) => (
                <div key={s.num} className="flex gap-4 items-start">
                  <div className="step-dot step-dot-active shrink-0 mt-0.5">{s.num}</div>
                  <div>
                    <h3 className="font-semibold text-[var(--color-text)] mb-1">{s.title}</h3>
                    <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== PRICING ===== */}
        <section id="pricing" className="py-16 px-5">
          <div className="max-w-5xl mx-auto">
            <p className="section-label text-center">Pricing</p>
            <h2 className="text-2xl md:text-3xl font-bold mb-3 text-center">Simple, transparent pricing.</h2>
            <p className="text-center text-[var(--color-text-muted)] mb-10 max-w-lg mx-auto">No subscriptions. No hidden fees. Start free, upgrade when ready.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {PRICING.map((p) => (
                <div key={p.name} className={`card p-6 flex flex-col ${p.highlight ? 'ring-2 ring-[var(--color-accent)]' : ''}`}>
                  {p.highlight && <span className="badge badge-green self-start mb-3">Most popular</span>}
                  <h3 className="font-bold text-[var(--color-text)]">{p.name}</h3>
                  <div className="mt-2 mb-4">
                    <span className="text-3xl font-extrabold text-[var(--color-text)]">{p.price}</span>
                    <span className="text-sm text-[var(--color-text-muted)] ml-1">{p.sub}</span>
                  </div>
                  <ul className="space-y-2 mb-6 flex-1">
                    {p.features.map((f) => (
                      <li key={f} className="text-sm text-[var(--color-text-muted)] flex items-start gap-2">
                        <svg className="w-4 h-4 text-[var(--color-accent)] shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                  {p.href === '/generator' ? (
                    <Link href={p.href} className={`${p.highlight ? 'btn-primary' : 'btn-secondary'} text-center no-underline w-full`}>{p.cta}</Link>
                  ) : (
                    <button className="btn-secondary w-full opacity-75 cursor-not-allowed" disabled>{p.cta}</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== DISCLAIMER ===== */}
        <section className="py-12 px-5 bg-[var(--color-surface)]">
          <div className="max-w-3xl mx-auto">
            <div className="disclaimer-box">
              <strong>Disclaimer:</strong> PassportKit is a product transparency and DPP-readiness tool. It helps brands organize and publish product information through QR-accessible product passport pages. PassportKit is not legal advice, does not certify regulatory compliance, and does not replace guidance from qualified legal, product safety, or compliance professionals. Product information is provided by the brand or product owner.
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
