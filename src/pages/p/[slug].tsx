import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useRef, useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PassportPDFLayout from '@/components/PassportPDFLayout';
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
      .eq('status', 'published')
      .eq('visibility', 'public')
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
  const qrRef = useRef<HTMLDivElement>(null);
  const pdfContainerRef = useRef<HTMLDivElement>(null);
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
        <Navbar variant="passport" />
        <main className="pt-14 min-h-screen flex items-center justify-center">
          <div className="text-center px-5">
            <h1 className="text-2xl font-bold mb-2">Passport not found</h1>
            <p className="text-[var(--color-text-muted)] mb-6">This passport does not exist or is not published.</p>
            <a href="/generator" className="btn-primary no-underline">Create a passport</a>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const quality = calculateDataQuality(passport);
  const checklists = getModuleChecklists(passport.product_category_module as CategoryModule);

  /* ------ QR Download ------ */
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

  /* ------ PDF Download (dedicated PDF layout) ------ */
  const handleDownloadPDF = useCallback(async () => {
    if (!pdfContainerRef.current) return;
    setDownloading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      // Show the hidden PDF container temporarily
      const pdfEl = pdfContainerRef.current;
      pdfEl.style.display = 'block';
      pdfEl.style.position = 'absolute';
      pdfEl.style.left = '-9999px';
      pdfEl.style.top = '0';

      // Wait for rendering
      await new Promise(r => setTimeout(r, 300));

      const canvas = await html2canvas(pdfEl, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#FFFFFF',
        logging: false,
        width: pdfEl.scrollWidth,
        height: pdfEl.scrollHeight,
        windowWidth: pdfEl.scrollWidth,
      });

      pdfEl.style.display = 'none';
      pdfEl.style.position = '';
      pdfEl.style.left = '';

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      const pdfPageW = pdf.internal.pageSize.getWidth();
      const pdfPageH = pdf.internal.pageSize.getHeight();
      const marginX = 0;
      const marginY = 0;
      const usableW = pdfPageW - (marginX * 2);

      // Calculate the total image height when scaled to fit the page width
      const imgAspect = canvas.height / canvas.width;
      const scaledH = usableW * imgAspect;

      if (scaledH <= pdfPageH) {
        // Single page
        pdf.addImage(imgData, 'PNG', marginX, marginY, usableW, scaledH);
      } else {
        // Multi-page: slice the canvas into pages
        const pageCanvasH = (pdfPageH / scaledH) * canvas.height;
        let yOffset = 0;
        let pageNum = 0;

        while (yOffset < canvas.height) {
          if (pageNum > 0) pdf.addPage();

          const sliceH = Math.min(pageCanvasH, canvas.height - yOffset);
          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = canvas.width;
          pageCanvas.height = sliceH;
          const pCtx = pageCanvas.getContext('2d');
          if (pCtx) {
            pCtx.fillStyle = '#FFFFFF';
            pCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
            pCtx.drawImage(canvas, 0, yOffset, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
          }

          const pageImgData = pageCanvas.toDataURL('image/png');
          const pageScaledH = (sliceH / canvas.width) * usableW;
          pdf.addImage(pageImgData, 'PNG', marginX, marginY, usableW, pageScaledH);

          yOffset += sliceH;
          pageNum++;
        }
      }

      // Generate filename: brand-product-passport.pdf
      const sanitize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const filename = `${sanitize(passport.brand_name)}-${sanitize(passport.product_name)}-passport.pdf`;
      pdf.save(filename);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('PDF download failed. Please try again.');
    } finally {
      setDownloading(false);
    }
  }, [passport, publicUrl]);

  /* ------ JSON Export ------ */
  const handleExportJSON = () => {
    window.open(`/api/passports/export-json?slug=${passport.slug}`, '_blank');
  };

  /* ------ Field Renderer ------ */
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

      <Navbar variant="passport" />

      <main className="pt-14 min-h-screen">
        {/* Success banner — only shown when ?created=true */}
        {createdInfo && (
          <div className="bg-[var(--color-accent-bg)] border-b border-[var(--color-border)] screen-only">
            <div className="max-w-4xl mx-auto px-5 py-5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[var(--color-accent)] flex items-center justify-center shrink-0 mt-0.5">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="white">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-bold text-[var(--color-accent)] mb-1">Passport published successfully.</h2>
                  <div className="space-y-1.5 text-sm">
                    <p><strong>Public URL:</strong> <a href={publicUrl} className="text-[var(--color-accent)] underline break-all">{publicUrl}</a></p>
                    {createdInfo.editUrl && (
                      <p><strong>Edit link:</strong> <a href={createdInfo.editUrl} className="text-[var(--color-accent)] underline break-all">{createdInfo.editUrl}</a></p>
                    )}
                  </div>
                  <div className="p-3 mt-3 rounded-lg bg-[var(--color-warning-soft)] border border-[var(--color-border)]">
                    <p className="text-xs text-[var(--color-warning)]">
                      <strong>Save this edit link privately.</strong> Anyone with this link can update the passport. It will not be shown on the public passport page.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-4xl mx-auto px-5 py-10">
          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 mb-8 screen-only">
            <button onClick={handleDownloadQR} className="btn-secondary btn-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              Download QR
            </button>
            <button onClick={handleDownloadPDF} disabled={downloading} className="btn-secondary btn-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              {downloading ? 'Generating…' : 'Download PDF'}
            </button>
            <button onClick={() => window.print()} className="btn-ghost btn-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              Print
            </button>
          </div>

          {/* ===== PASSPORT DOCUMENT ===== */}
          <div className="doc-card">
            {/* Header */}
            <div className="p-6 md:p-8 border-b border-[var(--color-border)]">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Product Image Area */}
                <div className="md:w-48 shrink-0">
                  {passport.product_image_url ? (
                    <div className="rounded-lg overflow-hidden border border-[var(--color-border)]" style={{ aspectRatio: '1' }}>
                      <img src={passport.product_image_url} alt={passport.product_name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="product-image-placeholder rounded-lg aspect-square">
                      <div className="flex flex-col items-center justify-center gap-1 h-full">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-[var(--color-text-dim)]">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                          <circle cx="8.5" cy="8.5" r="1.5"/>
                          <polyline points="21 15 16 10 5 21"/>
                        </svg>
                        <span className="text-xs text-[var(--color-text-dim)]">Product image</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Product Identity */}
                <div className="flex-1 min-w-0">
                  <p className="section-label mb-1">Digital Product Passport</p>
                  <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--color-text)] mb-1 tracking-tight leading-tight">
                    {passport.product_name}
                  </h1>
                  <p className="text-base text-[var(--color-text-muted)] mb-4">by {passport.brand_name}</p>

                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    {passport.category && <span className="badge badge-neutral">{passport.category}</span>}
                    {passport.last_updated && (
                      <span className="text-xs text-[var(--color-text-dim)]">Updated {passport.last_updated}</span>
                    )}
                  </div>

                  {/* Data completeness bar */}
                  <div className="max-w-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-[var(--color-text-secondary)]">Data completeness</span>
                      <span className="text-xs font-bold" style={{ color: getScoreColor(quality.level) }}>
                        {quality.score}%
                      </span>
                    </div>
                    <div className="score-bar">
                      <div className="score-bar-fill" style={{ width: `${quality.score}%`, backgroundColor: getScoreColor(quality.level) }} />
                    </div>
                    <p className="text-[10px] text-[var(--color-text-dim)] mt-1">
                      Transparency profile: {getScoreLabel(quality.level)}
                    </p>
                  </div>
                </div>

                {/* QR Code */}
                <div ref={qrRef} className="shrink-0 self-start">
                  <div className="bg-white p-3 rounded-lg border border-[var(--color-border)]">
                    <QRCodeSVG value={publicUrl} size={120} bgColor="#ffffff" fgColor="#111111" level="M" />
                  </div>
                  <p className="text-[9px] text-center text-[var(--color-text-dim)] mt-1.5">Scan for product passport</p>
                </div>
              </div>
            </div>

            {/* Sections */}
            <div className="p-6 md:p-8">
              {/* Product Identity */}
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
                    <details key={cl.id} className="rounded-lg border border-[var(--color-border-light)] p-3 group">
                      <summary className="cursor-pointer text-xs font-semibold text-[var(--color-text-secondary)] flex items-center gap-2">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 transition-transform group-open:rotate-90">
                          <polyline points="9 18 15 12 9 6"/>
                        </svg>
                        {cl.title}
                      </summary>
                      {cl.description && <p className="text-xs text-[var(--color-text-muted)] mt-2 ml-5">{cl.description}</p>}
                      {cl.warning && <p className="text-xs text-[var(--color-warning)] mt-1.5 ml-5">⚠ {cl.warning}</p>}
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

              {/* Advanced Data Export */}
              <div className="passport-section screen-only">
                <p className="section-label">Advanced data export</p>
                <p className="text-sm text-[var(--color-text-muted)] mb-3">
                  Export structured passport data as JSON for integration with other tools or systems.
                </p>
                <button onClick={handleExportJSON} className="btn-ghost btn-sm">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="16 18 22 12 16 6"/>
                    <polyline points="8 6 2 12 8 18"/>
                  </svg>
                  Export structured data
                </button>
              </div>

              {/* Disclaimer */}
              <div className="mt-6 pt-5 border-t border-[var(--color-border-light)]">
                <p className="text-xs text-[var(--color-text-dim)] leading-relaxed mb-1.5">
                  Product information is provided by the brand owner.
                </p>
                <p className="text-xs text-[var(--color-text-dim)] leading-relaxed">
                  PassportKit helps organize product transparency data and does not certify legal compliance.
                </p>
                {passport.watermark && (
                  <p className="text-xs text-[var(--color-text-dim)] mt-1.5 italic">
                    Demo passport created with PassportKit.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Watermark badge */}
      {passport.watermark && <div className="watermark-badge screen-only">Demo passport — PassportKit</div>}

      <Footer />

      {/* Hidden PDF Layout — rendered off-screen for html2canvas capture */}
      <div ref={pdfContainerRef} style={{ display: 'none' }}>
        <PassportPDFLayout passport={passport} publicUrl={publicUrl} />
      </div>
    </>
  );
}
