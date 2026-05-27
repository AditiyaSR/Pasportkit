import { QRCodeSVG } from 'qrcode.react';
import type { PassportRecord, CategoryModule } from '@/lib/types';
import { calculateDataQuality, getScoreLabel } from '@/lib/scoring';
import { getModuleChecklists } from '@/lib/categories';

interface Props {
  passport: PassportRecord;
  publicUrl: string;
}

/**
 * PassportPDFLayout — Dedicated A4-optimized PDF/print layout.
 * This is NOT the web view. It is rendered off-screen and captured
 * by html2canvas for PDF generation, or displayed via @media print.
 * 
 * Design: Professional A4 product data sheet.
 * Typography: 10–11pt body, readable at 100% zoom.
 * Layout: Print-safe spacing, no web-only UI.
 */
export default function PassportPDFLayout({ passport, publicUrl }: Props) {
  const quality = calculateDataQuality(passport);
  const checklists = getModuleChecklists(passport.product_category_module as CategoryModule);
  const shortUrl = publicUrl.replace(/^https?:\/\//, '');

  const PdfField = ({ label, value, fullWidth }: { label: string; value?: string; fullWidth?: boolean }) => {
    if (!value) return null;
    return (
      <div className={`pdf-field ${fullWidth ? 'pdf-grid-full' : ''}`}>
        <div className="pdf-label">{label}</div>
        <div className="pdf-value">{value}</div>
      </div>
    );
  };

  // Regulatory status helper
  const getRegStatus = (area: string, field?: string) => {
    const isEudrApplicable = ['furniture', 'wood_eudr_watch', 'leather_goods'].includes(passport.product_category_module);
    const isTextileApplicable = ['textile', 'fashion'].includes(passport.product_category_module);
    
    if (area === 'EUDR watch' && !isEudrApplicable) return { status: 'Not applicable', color: '#6B665C' };
    if (area === 'EUDR watch' && !field) return { status: 'Watchlist', color: '#B7791F' };
    
    if (area === 'Textile labelling' && !isTextileApplicable) return { status: 'Not applicable', color: '#6B665C' };
    
    if (!field) return { status: 'Missing', color: '#B91C1C' };
    if (field.trim().length > 20) return { status: 'Complete', color: '#4F6F52' };
    return { status: 'Needs review', color: '#B7791F' };
  };

  const getRegNote = (area: string, field?: string) => {
    if (field) return field;
    const isEudrApplicable = ['furniture', 'wood_eudr_watch', 'leather_goods'].includes(passport.product_category_module);
    if (area === 'EUDR watch' && !isEudrApplicable) return 'Not applicable for this product category.';
    if (area === 'EUDR watch') return 'Pending review against watchlist.';
    
    const isTextileApplicable = ['textile', 'fashion'].includes(passport.product_category_module);
    if (area === 'Textile labelling' && !isTextileApplicable) return 'Not applicable for non-textile products.';
    
    return 'Not reviewed';
  };

  const regItems = [
    { area: 'DPP-readiness', field: passport.dpp_readiness_notes },
    { area: 'GPSR-style product info', field: passport.gpsr_notes },
    { area: 'EUDR watch', field: passport.eudr_watch_notes },
    { area: 'REACH / SVHC', field: passport.reach_svhc_notes },
    { area: 'Packaging / PPWR', field: passport.packaging_ppwr_notes },
  ];

  if (passport.textile_label_notes || ['textile', 'fashion'].includes(passport.product_category_module as string)) {
    regItems.splice(2, 0, { area: 'Textile labelling', field: passport.textile_label_notes });
  }

  return (
    <div className="pdf-sheet" style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      {/* ===== HEADER ===== */}
      <div className="pdf-header">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '8pt', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: '#6B665C', marginBottom: '4px' }}>
            Digital Product Passport
          </div>
          <div style={{ fontSize: '22pt', fontWeight: 800, color: '#111111', lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: '4px', overflowWrap: 'break-word' as const }}>
            {passport.product_name}
          </div>
          <div style={{ fontSize: '11pt', color: '#6B665C', marginBottom: '10px' }}>
            by {passport.brand_name}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '8px', alignItems: 'center' }}>
            {passport.category && (
              <span style={{ fontSize: '8pt', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', background: '#F3F1EC', color: '#6B665C' }}>
                {passport.category}
              </span>
            )}
            <span style={{ fontSize: '8pt', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', background: '#EDF3ED', color: '#4F6F52' }}>
              Data completeness: {quality.score}%
            </span>
            {passport.last_updated && (
              <span style={{ fontSize: '8pt', color: '#9C9689' }}>
                Updated {passport.last_updated}
              </span>
            )}
          </div>
        </div>
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '4px' }}>
          <div style={{ background: '#fff', padding: '6px', border: '1px solid #E5DED1', borderRadius: '6px' }}>
            <QRCodeSVG value={publicUrl} size={90} bgColor="#ffffff" fgColor="#111111" level="M" />
          </div>
          <div style={{ fontSize: '8pt', color: '#6B665C', textAlign: 'center' as const, maxWidth: '120px', wordBreak: 'break-all' as const, lineHeight: '1.2' }}>
            {shortUrl}
          </div>
        </div>
      </div>

      {/* ===== PRODUCT IMAGE PLACEHOLDER ===== */}
      {passport.product_image_url && (
        <div style={{ marginBottom: '10px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #E5DED1', maxHeight: '140px' }}>
          <img
            src={passport.product_image_url}
            alt={passport.product_name}
            style={{ width: '100%', maxHeight: '140px', objectFit: 'cover' as const }}
            crossOrigin="anonymous"
          />
        </div>
      )}

      {/* ===== PRODUCT IDENTITY ===== */}
      <div className="pdf-section">
        <div className="pdf-section-title">Product Identity</div>
        <div className="pdf-grid">
          <PdfField label="SKU" value={passport.sku} />
          <PdfField label="Model" value={passport.model} />
          <PdfField label="Batch number" value={passport.batch_number} />
          <PdfField label="Serial number" value={passport.serial_number} />
          <PdfField label="GTIN" value={passport.gtin} />
          <PdfField label="Product type" value={passport.product_type} />
          {passport.target_markets?.length > 0 && (
            <PdfField label="Target markets" value={passport.target_markets.join(', ')} />
          )}
          <PdfField label="Product page" value={passport.product_page_url} fullWidth />
        </div>
      </div>

      {/* ===== MATERIALS ===== */}
      <div className="pdf-section">
        <div className="pdf-section-title">Materials & Composition</div>
        <div className="pdf-grid">
          <PdfField label="Materials" value={passport.materials} fullWidth />
          <PdfField label="Composition" value={passport.composition} fullWidth />
          <PdfField label="Recycled content" value={passport.recycled_content} />
          <PdfField label="Substances of concern" value={passport.substances_of_concern} />
          <PdfField label="Packaging materials" value={passport.packaging_materials} fullWidth />
        </div>
      </div>

      {/* ===== ORIGIN ===== */}
      <div className="pdf-section">
        <div className="pdf-section-title">Origin & Traceability</div>
        <div className="pdf-grid">
          <PdfField label="Country of origin" value={passport.country_of_origin} />
          <PdfField label="Production country" value={passport.production_country} />
          <PdfField label="Manufacturer" value={passport.manufacturer_name} />
          <PdfField label="Manufacturer contact" value={passport.manufacturer_contact} />
          <PdfField label="Supplier" value={passport.supplier_name} />
          <PdfField label="Importer contact" value={passport.importer_contact} />
          <PdfField label="Responsible person" value={passport.responsible_person_contact} />
          <PdfField label="Economic operator" value={passport.economic_operator_contact} />
        </div>
      </div>

      {/* ===== CARE & SAFETY ===== */}
      <div className="pdf-section">
        <div className="pdf-section-title">Care & Safe Use</div>
        <div className="pdf-grid">
          <PdfField label="Care instructions" value={passport.care_instructions} fullWidth />
          <PdfField label="Instructions for use" value={passport.instructions_for_use} fullWidth />
          <PdfField label="Safety warnings" value={passport.safety_warnings} fullWidth />
          <PdfField label="Age warning" value={passport.age_warning} />
          <PdfField label="Foreseeable misuse" value={passport.foreseeable_misuse} />
          <PdfField label="Risk notes" value={passport.risk_notes} fullWidth />
        </div>
      </div>

      {/* ===== REPAIR, RECYCLE & END-OF-LIFE ===== */}
      <div className="pdf-section">
        <div className="pdf-section-title">Repair, Recycle & End-of-Life</div>
        <div className="pdf-grid">
          <PdfField label="Repair" value={passport.repair_info} fullWidth />
          <PdfField label="Spare parts" value={passport.spare_parts_info} />
          <PdfField label="Durability" value={passport.durability_notes} />
          <PdfField label="Recycling" value={passport.recycling_info} fullWidth />
          <PdfField label="End-of-life" value={passport.end_of_life_info} fullWidth />
          <PdfField label="Takeback" value={passport.takeback_info} fullWidth />
          <PdfField label="Resale" value={passport.resale_info} />
        </div>
      </div>

      {/* ===== WARRANTY ===== */}
      <div className="pdf-section">
        <div className="pdf-section-title">Warranty & Support</div>
        <div className="pdf-grid">
          <PdfField label="Warranty" value={passport.warranty_info} fullWidth />
          <PdfField label="Support email" value={passport.support_email} />
          <PdfField label="Support URL" value={passport.support_url} />
        </div>
      </div>

      {/* ===== REGULATORY READINESS ===== */}
      <div className="pdf-section">
        <div className="pdf-section-title">Regulatory Readiness</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: '9pt', marginTop: '4px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #E5DED1' }}>
              <th style={{ textAlign: 'left' as const, padding: '5px 8px 5px 0', fontWeight: 700, fontSize: '8pt', textTransform: 'uppercase' as const, letterSpacing: '0.05em', color: '#6B665C' }}>Area</th>
              <th style={{ textAlign: 'left' as const, padding: '5px 8px', fontWeight: 700, fontSize: '8pt', textTransform: 'uppercase' as const, letterSpacing: '0.05em', color: '#6B665C', width: '90px' }}>Status</th>
              <th style={{ textAlign: 'left' as const, padding: '5px 0 5px 8px', fontWeight: 700, fontSize: '8pt', textTransform: 'uppercase' as const, letterSpacing: '0.05em', color: '#6B665C' }}>Note</th>
            </tr>
          </thead>
          <tbody>
            {regItems.map((item) => {
              const { status, color } = getRegStatus(item.area, item.field);
              const note = getRegNote(item.area, item.field);
              return (
                <tr key={item.area} style={{ borderBottom: '1px solid #EDE8DD' }}>
                  <td style={{ padding: '8px 8px 8px 0', fontWeight: 600, color: '#3D3A35', verticalAlign: 'top' }}>{item.area}</td>
                  <td style={{ padding: '8px 8px', verticalAlign: 'top' }}>
                    <span style={{ fontSize: '8pt', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', background: `${color}12`, color, display: 'inline-block' }}>
                      {status}
                    </span>
                  </td>
                  <td style={{ padding: '8px 0 8px 8px', color: '#6B665C', verticalAlign: 'top', overflowWrap: 'break-word' as const, wordBreak: 'break-word' as const, lineHeight: '1.4' }}>
                    {note}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ===== FOOTER ===== */}
      <div className="pdf-footer" style={{ marginTop: '16px' }}>
        <p style={{ marginBottom: '4px' }}>
          Information is provided by the brand/product owner. PassportKit helps organize product transparency data and does not certify legal compliance.
        </p>
        {passport.watermark && (
          <p style={{ fontStyle: 'italic' as const }}>
            Demo passport created with PassportKit.
          </p>
        )}
      </div>
    </div>
  );
}
