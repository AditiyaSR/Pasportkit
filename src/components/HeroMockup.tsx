import { QRCodeSVG } from 'qrcode.react';

/**
 * HeroMockup — A handcrafted visual showing a product passport card
 * with QR label, data completeness badge, and product sections.
 * Designed to look premium and not AI-generated.
 */
export default function HeroMockup() {
  return (
    <div className="landing-hero-visual relative">
      <div className="mockup-card max-w-md mx-auto">
        {/* Mockup Header */}
        <div className="px-6 pt-6 pb-4 border-b border-[var(--color-border-light)]">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--color-text-muted)] mb-1">Digital Product Passport</p>
              <h3 className="text-lg font-extrabold text-[var(--color-text)] leading-tight tracking-tight">Solid Oak Utility Stool</h3>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">by Oak & Room</p>
              <div className="flex items-center gap-2 mt-2.5">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#F3F1EC] text-[var(--color-text-muted)]">
                  Furniture / wood
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--color-accent-bg)] text-[var(--color-accent)]">
                  78% complete
                </span>
              </div>
            </div>
            <div className="shrink-0 bg-white p-2 rounded-lg border border-[var(--color-border-light)]">
              <QRCodeSVG value="https://passportkit.com/p/sample" size={64} bgColor="#ffffff" fgColor="#111111" level="M" />
            </div>
          </div>
        </div>

        {/* Product Image Placeholder */}
        <div className="mx-6 mt-4 mb-3">
          <div className="product-image-placeholder h-28 rounded-lg relative overflow-hidden">
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-[var(--color-text-dim)]">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              <span className="text-[10px] text-[var(--color-text-dim)]">Product image</span>
            </div>
          </div>
        </div>

        {/* Sample Section Previews */}
        <div className="px-6 pb-2">
          {/* Materials */}
          <div className="py-3 border-t border-[var(--color-border-light)]">
            <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-muted)] mb-1.5">Materials & composition</p>
            <p className="text-xs text-[var(--color-text)] leading-relaxed">Solid European oak, water-based lacquer finish</p>
          </div>

          {/* Origin */}
          <div className="py-3 border-t border-[var(--color-border-light)]">
            <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-muted)] mb-1.5">Origin & traceability</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[9px] text-[var(--color-text-dim)]">Country</p>
                <p className="text-xs text-[var(--color-text)]">Lithuania</p>
              </div>
              <div>
                <p className="text-[9px] text-[var(--color-text-dim)]">Manufacturer</p>
                <p className="text-xs text-[var(--color-text)]">Medžio Dirbtuvės</p>
              </div>
            </div>
          </div>

          {/* Care */}
          <div className="py-3 border-t border-[var(--color-border-light)]">
            <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-muted)] mb-1.5">Care & safe use</p>
            <p className="text-xs text-[var(--color-text)] leading-relaxed">Wipe with damp cloth. Indoor use only. Max load: 120kg.</p>
          </div>
        </div>

        {/* QR Tag Strip */}
        <div className="px-6 pb-5">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-surface-alt)] border border-[var(--color-border-light)]">
            <div className="shrink-0 bg-white p-1.5 rounded border border-[var(--color-border-light)]">
              <QRCodeSVG value="https://passportkit.com/p/sample" size={28} bgColor="#ffffff" fgColor="#111111" level="M" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-[var(--color-text)]">Scan for product passport</p>
              <p className="text-[9px] text-[var(--color-text-dim)]">passportkit.com/p/oak-stool</p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating completeness badge */}
      <div className="absolute -top-3 -right-2 sm:-right-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2 shadow-sm hidden sm:block">
        <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-0.5">Data completeness</p>
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-extrabold text-[var(--color-accent)]">78</span>
          <span className="text-xs font-semibold text-[var(--color-accent)]">%</span>
        </div>
        <div className="w-16 h-1 mt-1 rounded-full bg-[var(--color-border-light)]">
          <div className="h-1 rounded-full bg-[var(--color-accent)]" style={{ width: '78%' }} />
        </div>
      </div>
    </div>
  );
}
