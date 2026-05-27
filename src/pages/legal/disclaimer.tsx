import Head from 'next/head';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function DisclaimerPage() {
  return (
    <>
      <Head>
        <title>Legal Disclaimer — PassportKit</title>
        <meta name="description" content="Legal disclaimer for PassportKit product transparency tool." />
      </Head>

      <Navbar />

      <main className="pt-14 min-h-screen">
        <div className="max-w-3xl mx-auto px-5 py-12">
          <p className="section-label mb-4">Legal</p>
          <h1 className="text-3xl font-bold mb-6">Disclaimer</h1>

          <div className="prose space-y-6 text-[var(--color-text-secondary)] leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-[var(--color-text)] mt-8 mb-3">About PassportKit</h2>
              <p>PassportKit is a product transparency and DPP-readiness tool. It helps brands organize and publish product information through QR-accessible product passport pages.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[var(--color-text)] mt-8 mb-3">Not legal advice</h2>
              <p>PassportKit is not legal advice, does not certify regulatory compliance, and does not replace guidance from qualified legal, product safety, or compliance professionals.</p>
              <p>PassportKit does not:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Certify that products meet EU or any other regulatory requirements</li>
                <li>Provide legal opinions on product compliance</li>
                <li>Replace conformity assessment, CE marking, or official certification processes</li>
                <li>Generate officially recognized Digital Product Passports under EU ESPR</li>
                <li>Provide GPSR compliance certification</li>
                <li>Generate certified battery passports</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[var(--color-text)] mt-8 mb-3">Product information responsibility</h2>
              <p>Product information displayed on PassportKit passport pages is provided by the brand or product owner. PassportKit does not verify the accuracy, completeness, or legal sufficiency of this information.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[var(--color-text)] mt-8 mb-3">Regulatory readiness checklists</h2>
              <p>The regulatory readiness checklists, data quality scores, and missing-data prompts in PassportKit are educational tools to help brands organize product information. They are not definitive compliance checklists and may not reflect the latest regulatory requirements.</p>
              <p>Brands should consult qualified professionals for specific regulatory obligations applicable to their products and markets.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[var(--color-text)] mt-8 mb-3">Limitation of liability</h2>
              <p>PassportKit is provided &quot;as is&quot; without warranties of any kind. Use of PassportKit does not create a professional-client relationship and does not constitute professional advice.</p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
