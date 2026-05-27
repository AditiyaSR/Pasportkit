import Link from 'next/link';
import { useState } from 'react';

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--color-surface)] border-b border-[var(--color-border)]">
      <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 no-underline">
          <span className="text-base font-bold tracking-tight text-[var(--color-text)]">
            Passport<span className="text-[var(--color-accent)]">Kit</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <Link href="/sample" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors no-underline">Examples</Link>
          <Link href="/docs/checklist" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors no-underline">Checklist</Link>
          <Link href="/#pricing" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors no-underline">Pricing</Link>
          <Link href="/generator" className="btn-primary btn-sm no-underline">Create passport</Link>
        </div>

        <button className="md:hidden p-1.5" onClick={() => setOpen(!open)} aria-label="Menu">
          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            {open
              ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 flex flex-col gap-3">
          <Link href="/sample" className="text-sm text-[var(--color-text-muted)] no-underline" onClick={() => setOpen(false)}>Examples</Link>
          <Link href="/docs/checklist" className="text-sm text-[var(--color-text-muted)] no-underline" onClick={() => setOpen(false)}>Checklist</Link>
          <Link href="/#pricing" className="text-sm text-[var(--color-text-muted)] no-underline" onClick={() => setOpen(false)}>Pricing</Link>
          <Link href="/generator" className="btn-primary btn-sm no-underline text-center" onClick={() => setOpen(false)}>Create passport</Link>
        </div>
      )}
    </nav>
  );
}
