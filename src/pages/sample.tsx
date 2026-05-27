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
          <div className="text-center mb-12">
            <p className="section-label">Examples</p>
            <h1 className="text-3xl font-bold mb-3 tracking-tight">Sample product passports</h1>
            <p className="text-[var(--color-text-muted)] max-w-xl mx-auto">
              Browse example passports for different product categories. Use &quot;Load sample passport&quot; in the generator to start from a template.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {SAMPLE_TEMPLATES.map((tpl) => {
              const q = calculateDataQuality({ ...tpl.data, slug: '', edit_token: '' } as PassportRecord);
              return (
                <div key={tpl.id} className="card card-interactive p-6 flex flex-col">
                  {/* Product image placeholder */}
                  <div className="product-image-placeholder h-28 rounded-lg mb-4 relative">
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-[var(--color-text-dim)]">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                      </svg>
                      <span className="text-[10px] text-[var(--color-text-dim)]">Product image</span>
                    </div>
                  </div>

                  <div className="flex items-start justify-between mb-2">
                    <div className="min-w-0">
                      <h2 className="font-bold text-[var(--color-text)]">{tpl.data.product_name}</h2>
                      <p className="text-sm text-[var(--color-text-muted)]">by {tpl.data.brand_name}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-3">
                    <span className="badge badge-neutral">{tpl.data.category}</span>
                    {tpl.data.country_of_origin && <span className="badge badge-neutral">{tpl.data.country_of_origin}</span>}
                  </div>

                  {/* Data completeness */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex-1">
                      <div className="score-bar">
                        <div className="score-bar-fill" style={{ width: `${q.score}%`, backgroundColor: getScoreColor(q.level) }} />
                      </div>
                    </div>
                    <span className="text-xs font-semibold" style={{ color: getScoreColor(q.level) }}>
                      {q.score}%
                    </span>
                  </div>

                  <p className="text-sm text-[var(--color-text-muted)] mb-4 flex-1">{tpl.description}</p>

                  {tpl.data.materials && (
                    <p className="text-xs text-[var(--color-text-muted)] mb-4 line-clamp-2">
                      <strong>Materials:</strong> {tpl.data.materials.slice(0, 100)}{tpl.data.materials.length > 100 ? '…' : ''}
                    </p>
                  )}

                  <Link href={`/generator?sample=${tpl.id}`} className="btn-secondary btn-sm text-center no-underline w-full">
                    Use this template
                  </Link>
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
