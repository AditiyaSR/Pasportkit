import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getServerEnvStatus, type ServerEnvStatus } from '@/lib/env';

type Props = {
  status: ServerEnvStatus;
};

function StatusBadge({ ok }: { ok: boolean }) {
  return (
    <span className={`badge ${ok ? 'badge-accent' : 'badge-neutral'}`}>
      {ok ? 'Configured' : 'Setup required'}
    </span>
  );
}

function SetupCard({
  title,
  description,
  configured,
  missing,
}: {
  title: string;
  description: string;
  configured: boolean;
  missing: string[];
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <h2 className="font-bold">{title}</h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">{description}</p>
        </div>
        <StatusBadge ok={configured} />
      </div>
      {missing.length > 0 && (
        <div className="mt-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3">
          <p className="text-xs font-semibold text-[var(--color-text-muted)] mb-2">Missing variables</p>
          <div className="flex flex-wrap gap-2">
            {missing.map((name) => (
              <code key={name} className="rounded bg-white px-2 py-1 text-xs text-[var(--color-text-secondary)]">
                {name}
              </code>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  return {
    props: {
      status: getServerEnvStatus(),
    },
  };
};

export default function AdminSetupPage({ status }: Props) {
  return (
    <>
      <Head>
        <title>Setup Status - PassportKit</title>
      </Head>
      <Navbar />
      <main className="pt-14 min-h-screen bg-[var(--color-surface-alt)]">
        <div className="max-w-5xl mx-auto px-5 py-10">
          <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="section-label mb-2">Operations</p>
              <h1 className="text-2xl font-bold">Setup status</h1>
              <p className="text-sm text-[var(--color-text-muted)] mt-2 max-w-2xl">
                Check whether the required PassportKit services are configured. Secret values are never shown here.
              </p>
            </div>
            <Link href="/dashboard" className="btn-secondary">
              Back to dashboard
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <SetupCard
              title="Core Supabase"
              description="Required for auth, passport storage, dashboard data, and public passport pages."
              configured={status.core.configured}
              missing={status.core.missing}
            />
            <SetupCard
              title="Service role"
              description="Required server-side for create APIs, workspace repair, public safe fetches, and event logging."
              configured={status.supabaseService.configured}
              missing={status.supabaseService.missing}
            />
            <SetupCard
              title="Stripe"
              description="Optional billing integration. Missing keys should not block passport creation."
              configured={status.stripe.configured}
              missing={status.stripe.missing}
            />
            <SetupCard
              title="Shopify"
              description="Optional product import and metafield sync integration."
              configured={status.shopify.configured}
              missing={status.shopify.missing}
            />
            <SetupCard
              title="AI assistant"
              description="Optional product data suggestion integration."
              configured={status.ai.configured}
              missing={status.ai.missing}
            />
            <SetupCard
              title="Email automation"
              description="Optional team, passport, and billing notification emails."
              configured={status.email.configured}
              missing={status.email.missing}
            />
          </div>

          <div className="card p-5 mt-6">
            <h2 className="font-bold mb-2">Database and storage checklist</h2>
            <ul className="text-sm text-[var(--color-text-muted)] space-y-2">
              <li>Run `supabase/setup_all.sql` first.</li>
              <li>Run `supabase/rls_policies.sql` after table setup.</li>
              <li>Run `supabase/storage.sql` for the `product-images` bucket.</li>
              <li>Use `supabase/repair_user_workspace.sql` to repair users created before workspace setup was stable.</li>
            </ul>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
