import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase, getPublicPassportUrl } from '@/lib/supabase';
import { calculateDataQuality, getScoreLabel, getScoreColor } from '@/lib/scoring';
import { detectCategoryModule } from '@/lib/categories';
import type { PassportRecord } from '@/lib/types';

interface Props {
  passport: PassportRecord | null;
  editToken: string;
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ params, query }) => {
  const slug = params?.slug as string;
  const token = query.token as string;
  if (!slug || !token) return { props: { passport: null, editToken: '' } };

  try {
    const { data, error } = await supabase
      .from('passports')
      .select('*')
      .eq('slug', slug)
      .eq('edit_token', token)
      .single();

    if (error || !data) return { props: { passport: null, editToken: '' } };
    return { props: { passport: data as PassportRecord, editToken: token } };
  } catch {
    return { props: { passport: null, editToken: '' } };
  }
};

// Reuse field label helper
function fieldLabel(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    .replace('Url', 'URL').replace('Sku', 'SKU').replace('Gtin', 'GTIN')
    .replace('Gpsr', 'GPSR').replace('Dpp', 'DPP');
}

const TEXT_FIELDS: (keyof PassportRecord)[] = [
  'brand_name', 'product_name', 'category', 'product_type', 'sku', 'model',
  'batch_number', 'serial_number', 'gtin', 'product_page_url', 'product_image_url',
  'materials', 'composition', 'recycled_content', 'substances_of_concern', 'packaging_materials',
  'country_of_origin', 'production_country', 'supplier_name', 'manufacturer_name',
  'manufacturer_contact', 'importer_contact', 'responsible_person_contact', 'economic_operator_contact',
  'care_instructions', 'instructions_for_use', 'safety_warnings', 'age_warning', 'foreseeable_misuse', 'risk_notes',
  'repair_info', 'spare_parts_info', 'durability_notes', 'recycling_info',
  'end_of_life_info', 'takeback_info', 'resale_info',
  'warranty_info', 'support_email', 'support_url',
  'gpsr_notes', 'dpp_readiness_notes', 'textile_label_notes', 'reach_svhc_notes',
  'packaging_ppwr_notes', 'eudr_watch_notes', 'ce_marking_warning', 'battery_passport_warning',
  'last_updated',
];

export default function EditPassportPage({ passport: initial, editToken }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<Record<string, unknown>>(initial ? { ...initial } : {});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  if (!initial) {
    return (
      <>
        <Navbar />
        <main className="pt-14 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Invalid edit link</h1>
            <p className="text-[var(--color-text-muted)]">This edit link is invalid or has expired.</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const res = await fetch('/api/passports/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, slug: initial.slug, edit_token: editToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      setSaved(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  const quality = calculateDataQuality(form as unknown as PassportRecord);

  return (
    <>
      <Head>
        <title>Edit Passport — {initial.product_name}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <Navbar />
      <main className="pt-14 min-h-screen">
        <div className="max-w-4xl mx-auto px-5 py-10">
          <div className="p-4 rounded-lg bg-[var(--color-warning-bg)] border border-[var(--color-border)] mb-6 no-print">
            <p className="text-sm text-[var(--color-warning)]">⚠ Anyone with this edit link can update this passport. Keep it private.</p>
          </div>

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Edit passport</h1>
              <p className="text-sm text-[var(--color-text-muted)]">{initial.brand_name} — {initial.product_name}</p>
            </div>
            <a href={getPublicPassportUrl(initial.slug)} target="_blank" rel="noopener noreferrer" className="btn-ghost btn-sm no-underline">View public page ↗</a>
          </div>

          {/* Score */}
          <div className="card p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Data quality</span>
              <span className="font-bold" style={{ color: getScoreColor(quality.level) }}>{quality.score}/100 — {getScoreLabel(quality.level)}</span>
            </div>
            <div className="score-bar mt-2"><div className="score-bar-fill" style={{ width: `${quality.score}%`, background: getScoreColor(quality.level) }} /></div>
          </div>

          {/* Fields */}
          <div className="card p-6 md:p-8 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {TEXT_FIELDS.map((key) => {
                const isLong = ['materials', 'composition', 'care_instructions', 'safety_warnings', 'repair_info', 'recycling_info', 'gpsr_notes', 'dpp_readiness_notes'].includes(key);
                return (
                  <div key={key} className={isLong ? 'md:col-span-2' : ''}>
                    <label className="form-label">{fieldLabel(key)}</label>
                    {isLong ? (
                      <textarea className="form-input" rows={3} value={String(form[key] || '')} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} />
                    ) : (
                      <input className="form-input" value={String(form[key] || '')} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Save */}
          {error && <div className="p-3 rounded-lg bg-[var(--color-danger-bg)] mb-4"><p className="text-sm text-[var(--color-danger)]">{error}</p></div>}
          {saved && <div className="p-3 rounded-lg bg-[var(--color-accent-bg)] mb-4"><p className="text-sm text-[var(--color-accent)]">✓ Passport updated successfully.</p></div>}

          <div className="flex justify-end gap-3">
            <a href={getPublicPassportUrl(initial.slug)} className="btn-secondary no-underline">View public page</a>
            <button onClick={handleSave} disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save changes'}</button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
