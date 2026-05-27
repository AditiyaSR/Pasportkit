import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useRef, useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase, getPublicPassportUrl, getSiteUrl } from '@/lib/supabase';
import { calculateDataQuality, getScoreLabel, getScoreColor } from '@/lib/scoring';
import { getModuleChecklists } from '@/lib/categories';
import type { PassportRecord, CategoryModule } from '@/lib/types';

interface Props {
  passport: PassportRecord | null;
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ params }) => {
  const slug = params?.slug as string;
  if (!slug) return { props: { passport: null } };

  try {
    const { data, error } = await supabase
      .from('passports')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !data) return { props: { passport: null } };

    // Remove edit_token from public view
    const { edit_token, ...publicData } = data;
    return { props: { passport: publicData as PassportRecord } };
  } catch {
    return { props: { passport: null } };
  }
};

export default function PublicPassportPage({ passport }: Props) {
  const router = useRouter();
  const passportRef = useRef<HTMLDivElement>(null);
  const qrRef = useRef<HTMLDivElement>(null);
  const [createdInfo, setCreatedInfo] = useState<{ editUrl?: string; edit_token?: string } | null>(null);
  const [downloading, setDownloading] = useState(false);

  const publicUrl = passport ? getPublicPassportUrl(passport.slug) : '';

  useEffect(() => {
    if (router.query.created === 'true') {
      const stored = sessionStorage.getItem('pk_last_created');
      if (stored) {
        setCreatedInfo(JSON.parse(stored));
        sessionStorage.removeItem('pk_last_created');
      }
    }
  }, [router.query]);

  if (!passport) {
    return (
      <>
        <Navbar />
        <main className="pt-14 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Passport not found</h1>
            <p className="text-[var(--color-text-muted)] mb-4">This passport does not exist or is not published.</p>
            <a href="/generator" className="btn-primary no-underline">Create a passport</a>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const quality = calculateDataQuality(passport);
  const checklists = getModuleChecklists(passport.product_category_module as CategoryModule);

  const handleDownloadQR = () => {
    if (!qrRef.current) return;
    const svg = qrRef.current.querySelector('svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      if (ctx) { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 512, 512); ctx.drawImage(img, 0, 0, 512, 512); }
      const link = document.createElement('a');
      link.download = `${passport.slug}-qr.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleDownloadPDF = async () => {
    if (!passportRef.current) return;
    setDownloading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;
      const canvas = await html2canvas(passportRef.current, {
        scale: 2, useCORS: true, backgroundColor: '#FFFFFF', logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = (canvas.height * pdfW) / canvas.width;
      const maxH = pdf.internal.pageSize.getHeight() - 20;
      const finalW = pdfH > maxH ? (canvas.width * maxH) / canvas.height : pdfW;
      const finalH = pdfH > maxH ? maxH : pdfH;
      pdf.addImage(imgData, 'PNG', (pdfW - finalW) / 2, 10, finalW, finalH);
      pdf.save(`${passport.slug}-passport.pdf`);
    } catch (err) { console.error(err); alert('PDF download failed.'); }
    finally { setDownloading(false); }
  };

  const handleExportJSON = () => {
    window.open(`/api/passports/export-json?slug=${passport.slug}`, '_blank');
  };

  // Field renderer
  const PField = ({ label, value }: { label: string; value?: string }) => {
    if (!value) return null;
    return (
      <div className="passport-field">
        <span className="passport-field-label">{label}</span>
        <span className="passport-field-value">{value}</span>
      </div>
    );
  };

  return (
    <>
      <Head>
        <title>{passport.brand_name} — {passport.product_name} | Product Passport</title>
        <meta name="description" content={`Product passport for ${passport.brand_name} ${passport.product_name}. Materials, origin, care, safety, and sustainability information.`} />
      </Head>

      <Navbar />

      <main className="pt-14 min-h-screen">
        {/* Success banner */}
        {createdInfo && (
          <div className="bg-[var(--color-accent-bg)] border-b border-[var(--color-border)] no-print">
            <div className="max-w-4xl mx-auto px-5 py-4">
              <h2 className="text-sm font-bold text-[var(--color-accent)] mb-2">✓ Passport published successfully!</h2>
              <div className="space-y-1 text-sm">
                <p><strong>Public URL:</strong> <a href={publicUrl} className="text-[var(--color-accent)] underline break-all">{publicUrl}</a></p>
                {createdInfo.editUrl && (
                  <p><strong>Edit link:</strong> <a href={createdInfo.editUrl} className="text-[var(--color-accent)] underline break-all">{createdInfo.editUrl}</a></p>
                )}
              </div>
              <div className="p-3 mt-3 rounded-lg bg-[var(--color-warning-bg)] border border-[var(--color-border)]">
                <p className="text-xs text-[var(--color-warning)]">⚠ Save this edit link. Anyone with this link can update the passport. It will not be shown again.</p>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-4xl mx-auto px-5 py-8">
          {/* Actions bar */}
          <div className="flex flex-wrap items-center gap-2 mb-6 no-print">
            <button onClick={handleDownloadQR} className="btn-secondary btn-sm">Download QR</button>
            <button onClick={handleDownloadPDF} disabled={downloading} className="btn-secondary btn-sm">{downloading ? 'Generating…' : 'Download PDF'}</button>
            <button onClick={handleExportJSON} className="btn-secondary btn-sm">Export JSON</button>
            <button onClick={() => window.print()} className="btn-ghost btn-sm">Print</button>
          </div>

          {/* Passport document */}
          <div ref={passportRef} className="doc-card">
            {/* Header */}
            <div className="p-6 md:p-8 border-b border-[var(--color-border)]">
              <div className="flex flex-col sm:flex-row gap-6 justify-between">
                <div className="flex-1 min-w-0">
                  <p className="section-label mb-1">Digital Product Passport</p>
                  <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--color-text)] mb-1 tracking-tight">{passport.product_name}</h1>
                  <p className="text-base text-[var(--color-text-muted)]">by {passport.brand_name}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    {passport.category && <span className="badge badge-neutral">{passport.category}</span>}
                    <span className="badge" style={{ background: `${getScoreColor(quality.level)}15`, color: getScoreColor(quality.level) }}>
                      Score: {quality.score}/100
                    </span>
                    {passport.last_updated && <span className="text-xs text-[var(--color-text-dim)]">Updated {passport.last_updated}</span>}
                  </div>
                </div>
                <div ref={qrRef} className="shrink-0 self-start bg-white p-3 rounded-lg border border-[var(--color-border)]">
                  <QRCodeSVG value={publicUrl} size={110} bgColor="#ffffff" fgColor="#111111" level="M" />
                  <p className="text-[8px] text-center text-[var(--color-text-dim)] mt-1">Scan for passport</p>
                </div>
              </div>
              {passport.product_image_url && (
                <div className="mt-6 rounded-lg overflow-hidden border border-[var(--color-border)]" style={{ maxHeight: 280 }}>
                  <img src={passport.product_image_url} alt={passport.product_name} className="w-full object-cover" style={{ maxHeight: 280 }} />
                </div>
              )}
            </div>

            {/* Sections */}
            <div className="p-6 md:p-8">
              {/* Identity */}
              <div className="passport-section">
                <p className="section-label">Product identity</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                  <PField label="SKU" value={passport.sku} />
                  <PField label="Model" value={passport.model} />
                  <PField label="Batch number" value={passport.batch_number} />
                  <PField label="Serial number" value={passport.serial_number} />
                  <PField label="GTIN" value={passport.gtin} />
                  {passport.product_page_url && (
                    <div className="passport-field">
                      <span className="passport-field-label">Product page</span>
                      <a href={passport.product_page_url} target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--color-accent)] underline break-all">{passport.product_page_url}</a>
                    </div>
                  )}
                  {passport.target_markets.length > 0 && (
                    <div className="passport-field">
                      <span className="passport-field-label">Target markets</span>
                      <div className="flex gap-1 flex-wrap mt-1">{passport.target_markets.map((m) => <span key={m} className="badge badge-neutral">{m}</span>)}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Materials */}
              <div className="passport-section">
                <p className="section-label">Materials & composition</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                  <PField label="Materials" value={passport.materials} />
                  <PField label="Composition" value={passport.composition} />
                  <PField label="Recycled content" value={passport.recycled_content} />
                  <PField label="Substances of concern" value={passport.substances_of_concern} />
                  <PField label="Packaging materials" value={passport.packaging_materials} />
                </div>
              </div>

              {/* Origin */}
              <div className="passport-section">
                <p className="section-label">Origin & traceability</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                  <PField label="Country of origin" value={passport.country_of_origin} />
                  <PField label="Production country" value={passport.production_country} />
                  <PField label="Supplier" value={passport.supplier_name} />
                  <PField label="Manufacturer" value={passport.manufacturer_name} />
                  <PField label="Manufacturer contact" value={passport.manufacturer_contact} />
                  <PField label="Importer contact" value={passport.importer_contact} />
                  <PField label="Responsible person" value={passport.responsible_person_contact} />
                  <PField label="Economic operator" value={passport.economic_operator_contact} />
                </div>
              </div>

              {/* Care & Safety */}
              <div className="passport-section">
                <p className="section-label">Care & safe use</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                  <PField label="Care instructions" value={passport.care_instructions} />
                  <PField label="Instructions for use" value={passport.instructions_for_use} />
                  <PField label="Safety warnings" value={passport.safety_warnings} />
                  <PField label="Age warning" value={passport.age_warning} />
                  <PField label="Foreseeable misuse" value={passport.foreseeable_misuse} />
                  <PField label="Risk notes" value={passport.risk_notes} />
                </div>
              </div>

              {/* Circularity */}
              <div className="passport-section">
                <p className="section-label">Repair, recycle & end-of-life</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                  <PField label="Repair" value={passport.repair_info} />
                  <PField label="Spare parts" value={passport.spare_parts_info} />
                  <PField label="Durability" value={passport.durability_notes} />
                  <PField label="Recycling" value={passport.recycling_info} />
                  <PField label="End-of-life" value={passport.end_of_life_info} />
                  <PField label="Takeback" value={passport.takeback_info} />
                  <PField label="Resale" value={passport.resale_info} />
                </div>
              </div>

              {/* Warranty */}
              <div className="passport-section">
                <p className="section-label">Warranty & support</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                  <PField label="Warranty" value={passport.warranty_info} />
                  <PField label="Support email" value={passport.support_email} />
                  <PField label="Support URL" value={passport.support_url} />
                </div>
              </div>

              {/* Regulatory */}
              <div className="passport-section">
                <p className="section-label">Regulatory readiness</p>
                <div className="space-y-3">
                  {checklists.map((cl) => (
                    <details key={cl.id} className="rounded-lg border border-[var(--color-border-light)] p-3">
                      <summary className="cursor-pointer text-xs font-semibold text-[var(--color-text-secondary)]">{cl.title}</summary>
                      {cl.description && <p className="text-xs text-[var(--color-text-muted)] mt-1">{cl.description}</p>}
                      {cl.warning && <p className="text-xs text-[var(--color-warning)] mt-1">⚠ {cl.warning}</p>}
                    </details>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 mt-4">
                  <PField label="GPSR notes" value={passport.gpsr_notes} />
                  <PField label="DPP readiness" value={passport.dpp_readiness_notes} />
                  <PField label="Textile labelling" value={passport.textile_label_notes} />
                  <PField label="REACH/SVHC" value={passport.reach_svhc_notes} />
                  <PField label="Packaging/PPWR" value={passport.packaging_ppwr_notes} />
                  <PField label="EUDR watch" value={passport.eudr_watch_notes} />
                </div>
              </div>

              {/* Footer / Disclaimer */}
              <div className="mt-6 pt-4 border-t border-[var(--color-border-light)]">
                <p className="text-xs text-[var(--color-text-dim)] leading-relaxed">
                  Information is provided by the brand/product owner. PassportKit helps organize product transparency data and does not certify legal compliance.
                  {passport.watermark && <span> · Demo passport created with PassportKit.</span>}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {passport.watermark && <div className="watermark-badge no-print">Demo passport — PassportKit</div>}

      <Footer />
    </>
  );
}
