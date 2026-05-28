import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { EMPTY_PASSPORT, type PassportRecord } from '@/lib/types';
import { SAMPLE_TEMPLATES } from '@/lib/samples';
import { calculateDataQuality, getScoreLabel, getScoreColor } from '@/lib/scoring';
import { detectCategoryModule, getModuleChecklists } from '@/lib/categories';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { getDefaultWorkspace } from '@/lib/workspace';
import type { Workspace } from '@/lib/types';

const STEP_LABELS = [
  'Identity',
  'Materials',
  'Origin',
  'Care & Safety',
  'Circularity',
  'Warranty',
  'Regulatory',
  'Review',
];

const TARGET_MARKET_OPTIONS = ['EU', 'UK', 'US', 'Global', 'Other'];

type FormData = Omit<PassportRecord, 'slug' | 'edit_token'>;

export default function GeneratorPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>({ ...EMPTY_PASSPORT });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState('');
  
  const { user } = useAuth(false);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [generatingAi, setGeneratingAi] = useState(false);

  useEffect(() => {
    if (user) {
      getDefaultWorkspace(user.id).then(ws => setWorkspace(ws));
    }
  }, [user]);

  // Load sample from URL query param
  useEffect(() => {
    const sampleId = router.query.sample as string;
    if (sampleId) {
      const tpl = SAMPLE_TEMPLATES.find((t) => t.id === sampleId);
      if (tpl) setForm({ ...tpl.data });
    }
  }, [router.query.sample]);

  const update = (fields: Partial<FormData>) => setForm((prev) => ({ ...prev, ...fields }));
  const catModule = detectCategoryModule(form.category, form.product_type);
  const quality = calculateDataQuality({ ...form, slug: '', edit_token: '' } as PassportRecord);
  const checklists = getModuleChecklists(catModule);

  const loadSample = (id: string) => {
    const tpl = SAMPLE_TEMPLATES.find((t) => t.id === id);
    if (tpl) setForm({ ...tpl.data });
  };

  const canPublish = form.brand_name.trim().length > 0 && form.product_name.trim().length > 0;

  const handlePublish = async () => {
    if (!canPublish) return;
    setSaving(true);
    setError('');

    if (!isSupabaseConfigured()) {
      setError('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local to publish passports.');
      setSaving(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch('/api/passports/create', {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          ...form, 
          status: 'published',
          visibility: 'public',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create passport');

      // Store edit info in sessionStorage for success page
      sessionStorage.setItem('pk_last_created', JSON.stringify({
        slug: data.slug,
        publicUrl: data.publicUrl,
        editUrl: data.editUrl,
      }));

      router.push(`/p/${data.slug}?created=true`);
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
      const safeName = form.product_name ? form.product_name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'product';
      const fileName = `${safeName}-${Date.now()}.${ext}`;
      
      const { error } = await supabase.storage
        .from('product-images')
        .upload(fileName, file, { upsert: false });

      if (error) throw error;
      
      const { data: publicUrlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);
        
      update({ product_image_url: publicUrlData.publicUrl });
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Failed to upload image.');
    } finally {
      setUploadingImage(false);
    }
  };

  const prev = () => setStep((s) => Math.max(0, s - 1));
  const next = () => setStep((s) => Math.min(STEP_LABELS.length - 1, s + 1));

  const handleAiSuggest = async () => {
    if (!workspace || workspace.plan !== 'pro' && process.env.NODE_ENV !== 'development') {
      alert('AI features require Pro plan. Upgrade in your dashboard.');
      return;
    }
    setGeneratingAi(true);
    try {
      const res = await fetch('/api/ai/suggest-passport-fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}` },
        body: JSON.stringify({
          workspaceId: workspace.id,
          productData: {
            brand_name: form.brand_name,
            product_name: form.product_name,
            category: form.category,
            product_type: form.product_type,
            materials: form.materials,
          }
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      update({
        care_instructions: form.care_instructions || data.care_instructions || '',
        safety_warnings: form.safety_warnings || data.safety_warnings || '',
        repair_info: form.repair_info || data.repair_info || '',
        recycling_info: form.recycling_info || data.recycling_info || '',
        warranty_info: form.warranty_info || data.warranty_info || '',
      });
      alert('AI suggestions applied! Please review them.');
    } catch (err: any) {
      alert(`AI error: ${err.message}`);
    } finally {
      setGeneratingAi(false);
    }
  };

  // Field helper
  const Field = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
    <div>
      <label className="form-label">{label}</label>
      {children}
      {hint && <p className="form-hint">{hint}</p>}
    </div>
  );

  const Input = ({ field, placeholder, hint }: { field: keyof FormData; placeholder?: string; hint?: string }) => (
    <Field label={fieldLabel(field)} hint={hint}>
      <input className="form-input" value={String(form[field] || '')} onChange={(e) => update({ [field]: e.target.value })} placeholder={placeholder} />
    </Field>
  );

  const TextArea = ({ field, placeholder, hint, rows = 3 }: { field: keyof FormData; placeholder?: string; hint?: string; rows?: number }) => (
    <Field label={fieldLabel(field)} hint={hint}>
      <textarea className="form-input" rows={rows} value={String(form[field] || '')} onChange={(e) => update({ [field]: e.target.value })} placeholder={placeholder} />
    </Field>
  );

  return (
    <>
      <Head>
        <title>Create Passport — PassportKit</title>
        <meta name="description" content="Create a digital product passport. Fill in your product details and publish a public QR product passport page." />
      </Head>

      <Navbar />

      <main className="pt-14 min-h-screen">
        <div className="max-w-4xl mx-auto px-5 py-10">
          
          {!user && (
            <div className="mb-6 p-4 rounded-lg bg-[var(--color-surface-alt)] border border-[var(--color-border)] text-sm text-[var(--color-text-muted)] flex justify-between items-center">
              <span><strong>Demo mode.</strong> Sign in to save and manage passports in your dashboard.</span>
              <a href="/login" className="btn-secondary btn-sm">Log in</a>
            </div>
          )}
          {user && workspace && (
            <div className="mb-6 flex justify-between items-center">
              <span className="text-sm font-semibold text-[var(--color-accent)]">{workspace.name} ({workspace.plan.toUpperCase()})</span>
              {(workspace.plan === 'pro' || process.env.NODE_ENV === 'development') && (
                <button onClick={handleAiSuggest} disabled={generatingAi} className="btn-secondary btn-sm flex items-center gap-2">
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {generatingAi ? 'Generating...' : 'Suggest fields with AI'}
                </button>
              )}
            </div>
          )}

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold">Create product passport</h1>
              <p className="text-sm text-[var(--color-text-muted)] mt-1">Fill in product details, review data quality, then publish.</p>
            </div>
            <div>
              <select className="form-input" onChange={(e) => { if (e.target.value) loadSample(e.target.value); e.target.value = ''; }} defaultValue="">
                <option value="">Load sample passport…</option>
                {SAMPLE_TEMPLATES.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Step Nav */}
          <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-2 no-print">
            {STEP_LABELS.map((label, i) => (
              <button key={i} onClick={() => setStep(i)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${i === step ? 'bg-[var(--color-accent)] text-white' : i < step ? 'bg-[var(--color-accent-bg)] text-[var(--color-accent)]' : 'bg-[var(--color-border-light)] text-[var(--color-text-muted)]'}`}>
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: i === step ? 'rgba(255,255,255,0.25)' : 'transparent' }}>{i + 1}</span>
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* Steps */}
          <div className="card p-6 md:p-8 mb-6">
            {step === 0 && (
              <div className="space-y-5 animate-fade-in">
                <h2 className="text-lg font-bold mb-1">Product identity</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Input field="brand_name" placeholder="e.g. Loom & Field" hint="Required" />
                  <Input field="product_name" placeholder="e.g. Organic Cotton Everyday Tee" hint="Required" />
                  <Input field="category" placeholder="e.g. Textile / apparel" hint="Used for category-specific checklists" />
                  <Input field="product_type" placeholder="e.g. T-shirt" />
                  <Input field="sku" placeholder="e.g. LF-TEE-OC-001" />
                  <Input field="model" placeholder="e.g. Everyday Tee" />
                  <Input field="batch_number" placeholder="Optional" />
                  <Input field="serial_number" placeholder="Optional" />
                  <Input field="gtin" placeholder="e.g. 1234567890123" hint="Global Trade Item Number" />
                  <Input field="product_page_url" placeholder="https://..." />
                  
                  <div className="md:col-span-2 mt-2">
                    <label className="form-label">Product image</label>
                    <p className="form-hint mb-3">Adding a product image makes the passport look more professional.</p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 items-start">
                      {form.product_image_url ? (
                        <div className="relative w-32 h-32 rounded-lg border border-[var(--color-border)] overflow-hidden shrink-0 bg-[var(--color-surface)]">
                          <img src={form.product_image_url} alt="Product preview" className="w-full h-full object-cover" crossOrigin="anonymous" />
                          <button type="button" onClick={() => update({ product_image_url: '' })} className="absolute top-1 right-1 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-black/70">✕</button>
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
                          <input className="form-input text-sm" value={String(form.product_image_url || '')} onChange={(e) => update({ product_image_url: e.target.value })} placeholder="https://..." disabled={uploadingImage} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="form-label">Target markets</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {TARGET_MARKET_OPTIONS.map((m) => (
                      <button key={m} type="button" className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${form.target_markets.includes(m) ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]' : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-border)]'}`}
                        onClick={() => update({ target_markets: form.target_markets.includes(m) ? form.target_markets.filter((x) => x !== m) : [...form.target_markets, m] })}>
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5 animate-fade-in">
                <h2 className="text-lg font-bold mb-1">Materials & composition</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2"><TextArea field="materials" placeholder="e.g. 100% organic cotton jersey, GOTS certified" /></div>
                  <div className="md:col-span-2"><TextArea field="composition" placeholder="e.g. 100% organic cotton" hint="Fibre/material composition for labelling" /></div>
                  <TextArea field="recycled_content" placeholder="e.g. 30% recycled polyester" />
                  <TextArea field="substances_of_concern" placeholder="e.g. No SVHC above 0.1% w/w" hint="Substances of very high concern note" />
                  <div className="md:col-span-2"><TextArea field="packaging_materials" placeholder="e.g. Recycled paper mailer, compostable poly bag" /></div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5 animate-fade-in">
                <h2 className="text-lg font-bold mb-1">Origin & economic operators</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Input field="country_of_origin" placeholder="e.g. Portugal" />
                  <Input field="production_country" placeholder="e.g. Portugal" />
                  <Input field="supplier_name" placeholder="Optional" />
                  <Input field="manufacturer_name" placeholder="e.g. Fábrica Têxtil do Norte" />
                  <Input field="manufacturer_contact" placeholder="e.g. info@manufacturer.com" />
                  <Input field="importer_contact" placeholder="EU importer contact if applicable" />
                  <Input field="responsible_person_contact" placeholder="EU responsible person if applicable" hint="For GPSR-covered consumer products" />
                  <Input field="economic_operator_contact" placeholder="Economic operator contact" />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5 animate-fade-in">
                <h2 className="text-lg font-bold mb-1">Use, care & safety</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <TextArea field="care_instructions" placeholder="e.g. Machine wash cold. Line dry. Do not bleach." />
                  <TextArea field="instructions_for_use" placeholder="e.g. Check fit before wearing. Follow care label." />
                  <TextArea field="safety_warnings" placeholder="e.g. Keep away from open flame." />
                  <Input field="age_warning" placeholder="e.g. Not suitable for children under 3" />
                  <TextArea field="foreseeable_misuse" placeholder="e.g. Do not use as protective equipment" />
                  <TextArea field="risk_notes" placeholder="Any additional risk information" />
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-5 animate-fade-in">
                <h2 className="text-lg font-bold mb-1">Circularity</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <TextArea field="repair_info" placeholder="e.g. Small holes can be repaired with cotton thread." />
                  <TextArea field="spare_parts_info" placeholder="e.g. Replacement buttons available on request." />
                  <TextArea field="durability_notes" placeholder="e.g. Designed for 3+ years of regular use." />
                  <TextArea field="recycling_info" placeholder="e.g. Textile recycling available in most EU countries." />
                  <TextArea field="end_of_life_info" placeholder="e.g. Return to brand for recycling credit." />
                  <TextArea field="takeback_info" placeholder="e.g. Send to our Circular Program." />
                  <TextArea field="resale_info" placeholder="e.g. Product can be resold through our marketplace." />
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-5 animate-fade-in">
                <h2 className="text-lg font-bold mb-1">Warranty & support</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2"><TextArea field="warranty_info" placeholder="e.g. 30-day policy for manufacturing defects." /></div>
                  <Input field="support_email" placeholder="e.g. support@brand.com" />
                  <Input field="support_url" placeholder="e.g. https://brand.com/support" />
                  <Input field="last_updated" placeholder="YYYY-MM-DD" hint="Date of last data update" />
                </div>
              </div>
            )}

            {step === 6 && (
              <div className="space-y-5 animate-fade-in">
                <h2 className="text-lg font-bold mb-1">Regulatory readiness</h2>
                <p className="text-sm text-[var(--color-text-muted)] mb-4">These are educational readiness notes, not legal certification. Detected category module: <strong>{catModule}</strong></p>

                {catModule === 'electronics_warning_only' && (
                  <div className="p-4 rounded-lg bg-[var(--color-warning-bg)] border border-[var(--color-border)] mb-4">
                    <p className="text-sm font-medium text-[var(--color-warning)]">⚠ This MVP does not certify CE-marked, electrical, toy, PPE, or medical products. Use this only as a transparency data organizer and consult a qualified compliance professional.</p>
                  </div>
                )}
                {catModule === 'battery_warning_only' && (
                  <div className="p-4 rounded-lg bg-[var(--color-warning-bg)] border border-[var(--color-border)] mb-4">
                    <p className="text-sm font-medium text-[var(--color-warning)]">⚠ Battery passports have specific EU requirements for certain battery categories. This MVP does not generate certified battery passports.</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <TextArea field="gpsr_notes" placeholder="Notes on GPSR-style product safety information readiness" hint="General Product Safety Regulation readiness notes" />
                  <TextArea field="dpp_readiness_notes" placeholder="Notes on Digital Product Passport data readiness" />
                  {['textile', 'fashion'].includes(catModule) && (
                    <TextArea field="textile_label_notes" placeholder="e.g. Fibre composition: 100% organic cotton. Care labels included." hint="Textile labelling readiness" />
                  )}
                  <TextArea field="reach_svhc_notes" placeholder="e.g. No SVHC above 0.1% w/w identified." hint="REACH / SVHC readiness note — not a compliance claim" />
                  <TextArea field="packaging_ppwr_notes" placeholder="e.g. Recyclable packaging, recycled content >50%." hint="Packaging / PPWR readiness note" />
                  {['furniture', 'wood_eudr_watch', 'leather_goods'].includes(catModule) && (
                    <TextArea field="eudr_watch_notes" placeholder="e.g. European oak from FSC-certified source." hint="EUDR watch — this is a watchlist prompt, not EUDR due diligence" />
                  )}
                  {catModule === 'electronics_warning_only' && (
                    <TextArea field="ce_marking_warning" placeholder="Note: CE conformity assessment is out of scope for this tool." />
                  )}
                  {catModule === 'battery_warning_only' && (
                    <TextArea field="battery_passport_warning" placeholder="Note: Battery passport certification is out of scope for this tool." />
                  )}
                </div>
              </div>
            )}

            {step === 7 && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="text-lg font-bold mb-1">Review & publish</h2>

                {/* Score */}
                <div className="card p-5 border border-[var(--color-border)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold">Data completeness</span>
                    <span className="text-2xl font-extrabold" style={{ color: getScoreColor(quality.level) }}>{quality.score}%</span>
                  </div>
                  <div className="score-bar mb-2">
                    <div className="score-bar-fill" style={{ width: `${quality.score}%`, background: getScoreColor(quality.level) }} />
                  </div>
                  <p className="text-sm text-[var(--color-text-muted)]">Transparency profile: {getScoreLabel(quality.level)}</p>
                </div>

                {/* Warnings */}
                {quality.warnings.length > 0 && (
                  <div className="p-4 rounded-lg bg-[var(--color-warning-bg)] border border-[var(--color-border)]">
                    <p className="text-sm font-semibold text-[var(--color-warning)] mb-2">Warnings</p>
                    <ul className="space-y-1">
                      {quality.warnings.map((w, i) => (
                        <li key={i} className="text-sm text-[var(--color-warning)] flex gap-2">
                          <span>⚠</span><span>{w}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Missing */}
                {quality.missing.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold mb-2">Missing fields ({quality.missing.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {quality.missing.map((m) => (
                        <span key={m} className="badge badge-yellow">{m}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Complete */}
                {quality.complete.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold mb-2">Completed ({quality.complete.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {quality.complete.map((c) => (
                        <span key={c} className="badge badge-green">{c}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Regulatory checklists */}
                <div>
                  <p className="text-sm font-semibold mb-3">Regulatory readiness checklists</p>
                  <div className="space-y-3">
                    {checklists.map((cl) => (
                      <details key={cl.id} className="card p-4">
                        <summary className="cursor-pointer text-sm font-medium text-[var(--color-text-secondary)]">{cl.title}</summary>
                        <p className="text-xs text-[var(--color-text-muted)] mt-2 mb-2">{cl.description}</p>
                        {cl.warning && (
                          <p className="text-xs text-[var(--color-warning)] mb-2">⚠ {cl.warning}</p>
                        )}
                        <ul className="space-y-1">
                          {cl.fields.map((f) => (
                            <li key={f} className="text-xs text-[var(--color-text-muted)] flex gap-2">
                              <span>·</span><span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      </details>
                    ))}
                  </div>
                </div>

                {/* Disclaimer */}
                <div className="disclaimer-box">
                  <strong>Disclaimer:</strong> PassportKit is a product transparency and DPP-readiness tool. It is not legal advice, does not certify regulatory compliance, and does not replace guidance from qualified legal, product safety, or compliance professionals.
                </div>

                {/* Error */}
                {error && (
                  <div className="p-4 rounded-lg bg-[var(--color-danger-bg)] border border-[var(--color-border)]">
                    <p className="text-sm text-[var(--color-danger)]">{error}</p>
                  </div>
                )}

                {/* Summary */}
                <div className="text-sm text-[var(--color-text-muted)]">
                  {canPublish ? (
                    <span className="text-[var(--color-accent)] font-medium">✓ Ready to publish: {form.brand_name} — {form.product_name}</span>
                  ) : (
                    <span className="text-[var(--color-danger)]">Brand name and product name are required.</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Nav Buttons */}
          <div className="flex items-center justify-between no-print">
            <button onClick={prev} disabled={step === 0} className="btn-secondary btn-sm" style={{ visibility: step === 0 ? 'hidden' : 'visible' }}>← Previous</button>
            <div className="text-xs text-[var(--color-text-muted)]">Step {step + 1} of {STEP_LABELS.length}</div>
            {step < STEP_LABELS.length - 1 ? (
              <button onClick={next} className="btn-primary btn-sm">Next →</button>
            ) : (
              <button onClick={handlePublish} disabled={!canPublish || saving} className="btn-primary">
                {saving ? 'Publishing…' : 'Publish public passport'}
              </button>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

// Human-readable field labels
function fieldLabel(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace('Url', 'URL')
    .replace('Sku', 'SKU')
    .replace('Gtin', 'GTIN')
    .replace('Gpsr', 'GPSR')
    .replace('Dpp', 'DPP')
    .replace('Svhc', 'SVHC')
    .replace('Ppwr', 'PPWR')
    .replace('Eudr', 'EUDR')
    .replace('Ce', 'CE');
}
