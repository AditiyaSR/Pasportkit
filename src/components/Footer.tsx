import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)] screen-only">
      <div className="max-w-6xl mx-auto px-5 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div className="md:col-span-2">
            <span className="text-base font-bold tracking-tight text-[var(--color-text)]">
              Passport<span className="text-[var(--color-accent)]">Kit</span>
            </span>
            <p className="text-sm text-[var(--color-text-muted)] mt-3 max-w-sm leading-relaxed">
              QR product passports for small brands. Organize product transparency data into public, QR-accessible product passport pages.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">Product</h4>
            <div className="flex flex-col gap-2">
              <Link href="/sample" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] no-underline transition-colors">Examples</Link>
              <Link href="/docs/checklist" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] no-underline transition-colors">Checklist</Link>
              <Link href="/#pricing" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] no-underline transition-colors">Pricing</Link>
              <Link href="/generator" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] no-underline transition-colors">Create passport</Link>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">Legal</h4>
            <div className="flex flex-col gap-2">
              <Link href="/legal/disclaimer" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] no-underline transition-colors">Disclaimer</Link>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-[var(--color-border-light)]">
          <p className="text-xs text-[var(--color-text-dim)] leading-relaxed max-w-3xl">
            PassportKit is a product transparency and DPP-readiness tool. It is not legal advice, does not certify regulatory compliance, and does not replace guidance from qualified legal, product safety, or compliance professionals. Product information is provided by the brand or product owner.
          </p>
          <p className="text-xs text-[var(--color-text-dim)] mt-3">© {new Date().getFullYear()} PassportKit</p>
        </div>
      </div>
    </footer>
  );
}
