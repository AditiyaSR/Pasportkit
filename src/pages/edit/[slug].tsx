import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase, getPublicPassportUrl, isSupabaseConfigured } from '@/lib/supabase';
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
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState('');

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setUploadError('Invalid file type. Please upload JPG, PNG, or WEBP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size exceeds 5MB limit.');
      return;
    }
    if (!isSupabaseConfigured()) {
      setUploadError('Supabase is not configured. Upload unavailable.');
      return;
    }
    setUploadingImage(true);
    setUploadError('');
    try {
      const ext = file.name.split('.').pop();
      const safeName = String(form.product_name || 'product').toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const fileName = `${safeName}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('product-images').upload(fileName, file, { upsert: false });
      if (error) throw error;
      const { data: publicUrlData } = supabase.storage.from('product-images').getPublicUrl(fileName);
      setForm((f) => ({ ...f, product_image_url: publicUrlData.publicUrl }));
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Failed to upload image.');
    } finally {
      setUploadingImage(false);
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

          {/* Completeness */}
          <div className="card p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Data completeness</span>
              <span className="font-bold" style={{ color: getScoreColor(quality.level) }}>{quality.score}% — Transparency profile: {getScoreLabel(quality.level)}</span>
            </div>
            <div className="score-bar mt-2"><div className="score-bar-fill" style={{ width: `${quality.score}%`, background: getScoreColor(quality.level) }} /></div>
          </div>

          {/* Fields */}
          <div className="card p-6 md:p-8 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {TEXT_FIELDS.map((key) => {
                if (key === 'product_image_url') {
                  return (
                    <div key={key} className="md:col-span-2 mt-2">
                      <label className="form-label">Product image</label>
                      <p className="form-hint mb-3">Adding a product image makes the passport look more professional.</p>
                      <div className="flex flex-col sm:flex-row gap-4 items-start">
                        {form.product_image_url ? (
                          <div className="relative w-32 h-32 rounded-lg border border-[var(--color-border)] overflow-hidden shrink-0 bg-[var(--color-surface)]">
                            <img src={String(form.product_image_url)} alt="Product preview" className="w-full h-full object-cover" crossOrigin="anonymous" />
                            <button type="button" onClick={() => setForm((f) => ({ ...f, product_image_url: '' }))} className="absolute top-1 right-1 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-black/70">✕</button>
                          </div>
                        ) : (
                          <div className="w-32 h-32 rounded-lg border border-dashed border-[var(--color-border)] flex items-center justify-center shrink-0 bg-[var(--color-surface-alt)]">
                            <span className="text-[10px] text-[var(--color-text-dim)]">No image</span>
                          </div>
                        )}
                        <div className="flex-1 space-y-3 w-full">
                          <div>
                            <label className="btn-secondary text-xs cursor-pointer inline-flex items-center justify-center">
                              {uploadingImage ? 'Uploading…' : 'Upload image (JPG, PNG, WEBP)'}
                              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                            </label>
                            <p className="text-[10px] text-[var(--color-text-muted)] mt-1">Max file size: 5MB</p>
                            {uploadError && <p className="form-error">{uploadError}</p>}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-[var(--color-text-muted)] mb-1">Or provide a direct image URL:</p>
                            <input className="form-input text-sm" value={String(form.product_image_url || '')} onChange={(e) => setForm((f) => ({ ...f, product_image_url: e.target.value }))} placeholder="https://..." disabled={uploadingImage} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

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
