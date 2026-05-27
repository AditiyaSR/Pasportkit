import Head from 'next/head';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const CHECKLISTS = [
  {
    id: 'dpp',
    title: 'DPP-readiness / ESPR-style data',
    description: 'Digital Product Passport fields that may be required under the developing EU Ecodesign for Sustainable Products Regulation (ESPR). Timelines and product scope are still being defined.',
    fields: [
      'Unique product identifier (SKU, model, GTIN)',
      'Materials and composition',
      'Manufacturing origin and traceability',
      'Manufacturer or economic operator contact',
      'Repairability information',
      'Recycling and end-of-life information',
      'Durability information',
      'Product documentation link',
      'Last updated date',
    ],
  },
  {
    id: 'gpsr',
    title: 'GPSR-style online product information',
    description: 'The General Product Safety Regulation requires certain online product safety information for covered consumer products sold in the EU.',
    fields: [
      'Product identification (name, image, type)',
      'Manufacturer name, address, and contact',
      'EU authorised representative or responsible person (if applicable)',
      'Importer name and contact (if applicable)',
      'Safety warnings and precautions',
      'Instructions for safe use',
      'Age warnings (if applicable)',
      'Language-appropriate information for target markets',
    ],
  },
  {
    id: 'textile',
    title: 'Textile composition & labelling',
    description: 'EU Textile Regulation requires fibre composition labelling for textile products.',
    fields: [
      'Fibre composition (e.g. 100% cotton, 80% polyester / 20% cotton)',
      'Care instructions (washing, drying, ironing)',
      'Country of manufacturing',
      'Material claims (organic, recycled, etc.)',
      'Care symbols',
    ],
  },
  {
    id: 'reach',
    title: 'REACH / SVHC information',
    description: 'Under REACH, suppliers must communicate information about substances of very high concern (SVHC) present above 0.1% w/w in articles.',
    fields: [
      'Substances of concern declaration',
      'Supplier SVHC communication',
      'Material safety information',
    ],
    warning: 'PassportKit does not verify REACH compliance. Consult a qualified professional.',
  },
  {
    id: 'ppwr',
    title: 'Packaging / PPWR readiness',
    description: 'The EU Packaging and Packaging Waste Regulation introduces requirements for packaging sustainability.',
    fields: [
      'Packaging material identification',
      'Packaging weight or volume',
      'Recyclability information',
      'Recycled content in packaging',
      'Reusability or compostability claims',
      'Packaging producer or importer contact',
    ],
    warning: 'PassportKit does not certify PPWR compliance.',
  },
  {
    id: 'eudr',
    title: 'EUDR watch',
    description: 'The EU Deforestation Regulation may affect products containing wood, rubber, cocoa, coffee, palm oil, soy, or cattle-derived materials.',
    fields: [
      'Relevant commodity identification (wood, rubber, cocoa, etc.)',
      'Source country',
      'Supplier traceability information',
      'Geolocation or due diligence notes',
    ],
    warning: 'This is a watchlist prompt. PassportKit does not perform EUDR due diligence.',
  },
  {
    id: 'battery',
    title: 'Battery passport (warning)',
    description: 'Certain battery categories will require specific digital battery passports under the EU Battery Regulation.',
    fields: [
      'Battery included (yes/no)',
      'Battery type (lithium-ion, lead-acid, etc.)',
      'Battery capacity',
    ],
    warning: 'This MVP does not generate certified battery passports. Consult a qualified professional for battery passport requirements.',
  },
  {
    id: 'ce',
    title: 'CE-marked products (warning)',
    description: 'Products requiring CE marking (electronics, toys, PPE, medical devices, etc.) must undergo conformity assessment procedures.',
    fields: [
      'Product may require CE marking (yes/no)',
      'Applicable directive or regulation',
    ],
    warning: 'This MVP does not replace CE conformity assessment. Consult a notified body or qualified compliance professional.',
  },
];

export default function ChecklistPage() {
  return (
    <>
      <Head>
        <title>Regulatory Readiness Checklist — PassportKit</title>
        <meta name="description" content="Educational checklist for product transparency: DPP readiness, GPSR, textile labelling, REACH, PPWR, EUDR, and more." />
      </Head>

      <Navbar />

      <main className="pt-14 min-h-screen">
        <div className="max-w-3xl mx-auto px-5 py-12">
          <p className="section-label mb-2">Educational reference</p>
          <h1 className="text-3xl font-bold mb-3">Regulatory readiness checklist</h1>
          <p className="text-[var(--color-text-muted)] mb-4 leading-relaxed">
            This checklist helps small brands understand what product transparency data may be relevant for their products. It is an educational tool, not a compliance certification.
          </p>

          <div className="disclaimer-box mb-8">
            <strong>Disclaimer:</strong> This checklist is for general informational purposes only. It does not constitute legal advice. Regulatory requirements vary by product type, market, and other factors. Consult qualified legal, product safety, or compliance professionals for specific obligations.
          </div>

          <div className="space-y-6">
            {CHECKLISTS.map((cl) => (
              <div key={cl.id} className="card p-6">
                <h2 className="font-bold text-[var(--color-text)] mb-1">{cl.title}</h2>
                <p className="text-sm text-[var(--color-text-muted)] mb-3">{cl.description}</p>
                {cl.warning && (
                  <div className="p-3 rounded-lg bg-[var(--color-warning-bg)] border border-[var(--color-border)] mb-3">
                    <p className="text-xs text-[var(--color-warning)]">⚠ {cl.warning}</p>
                  </div>
                )}
                <ul className="space-y-1.5">
                  {cl.fields.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-[var(--color-text-secondary)]">
                      <span className="mt-1 w-3 h-3 rounded border border-[var(--color-border)] shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/generator" className="btn-primary no-underline">Create a passport with these fields</Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
