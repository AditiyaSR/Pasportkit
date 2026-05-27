import Head from 'next/head';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { SAMPLE_TEMPLATES } from '@/lib/samples';
import { calculateDataQuality, getScoreLabel, getScoreColor } from '@/lib/scoring';
import type { PassportRecord } from '@/lib/types';

export default function SamplePage() {
  return (
    <>
      <Head>
        <title>Example Passports — PassportKit</title>
        <meta name="description" content="Browse example QR product passports for different product categories: textiles, leather goods, furniture, homeware, and more." />
      </Head>

      <Navbar />

      <main className="pt-14 min-h-screen">
        <div className="max-w-5xl mx-auto px-5 py-12">
          <div className="text-center mb-10">
            <p className="section-label">Examples</p>
            <h1 className="text-3xl font-bold mb-3">Sample product passports</h1>
            <p className="text-[var(--color-text-muted)] max-w-xl mx-auto">Browse example passports for different product categories. Use &quot;Load sample passport&quot; in the generator to start from a template.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {SAMPLE_TEMPLATES.map((tpl) => {
              const q = calculateDataQuality({ ...tpl.data, slug: '', edit_token: '' } as PassportRecord);
              return (
                <div key={tpl.id} className="card p-6 flex flex-col">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h2 className="font-bold text-[var(--color-text)]">{tpl.data.product_name}</h2>
                      <p className="text-sm text-[var(--color-text-muted)]">by {tpl.data.brand_name}</p>
                    </div>
                    <span className="badge" style={{ background: `${getScoreColor(q.level)}15`, color: getScoreColor(q.level) }}>{q.score}/100</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    <span className="badge badge-neutral">{tpl.data.category}</span>
                    {tpl.data.country_of_origin && <span className="badge badge-neutral">{tpl.data.country_of_origin}</span>}
                  </div>
                  <p className="text-sm text-[var(--color-text-muted)] mb-4 flex-1">{tpl.description}</p>
                  <div className="text-sm space-y-1 mb-4 text-[var(--color-text-muted)]">
                    {tpl.data.materials && <p><strong>Materials:</strong> {tpl.data.materials.slice(0, 80)}…</p>}
                  </div>
                  <Link href={`/generator?sample=${tpl.id}`} className="btn-secondary btn-sm text-center no-underline w-full">Use this template</Link>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-10">
            <Link href="/generator" className="btn-primary no-underline">Create your own passport</Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
