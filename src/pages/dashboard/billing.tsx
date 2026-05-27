import Head from 'next/head';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { getDefaultWorkspace } from '@/lib/workspace';
import type { Workspace } from '@/lib/types';
import { getPlanLimits } from '@/lib/billing';

export default function BillingPage() {
  const { user, loading } = useAuth(true);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) load();
  }, [user]);

  async function load() {
    if (!user) return;
    const ws = await getDefaultWorkspace(user.id);
    setWorkspace(ws);
  }

  const handleSubscribe = async (priceId: string) => {
    if (!workspace) return;
    setSaving(true);
    try {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, workspaceId: workspace.id })
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert(data.error);
    } catch (err) {
      alert('Failed to start checkout');
    } finally {
      setSaving(false);
    }
  };

  const handleManage = async () => {
    if (!workspace) return;
    setSaving(true);
    try {
      const res = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId: workspace.id })
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert(data.error);
    } catch (err) {
      alert('Failed to open portal');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) return null;

  return (
    <>
      <Head><title>Billing — PassportKit</title></Head>
      <Navbar />
      <main className="pt-14 min-h-screen bg-[var(--color-surface-alt)]">
        <div className="max-w-4xl mx-auto px-5 py-10">
          <h1 className="text-2xl font-bold mb-8">Billing & Subscription</h1>

          {workspace && (
            <div className="card p-6 md:p-8 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-lg font-bold mb-1">Current Plan: {workspace.plan.toUpperCase()}</h2>
                <p className="text-sm text-[var(--color-text-muted)]">
                  Status: <span className="capitalize">{workspace.subscription_status}</span>
                  {workspace.current_period_end && ` • Renews ${new Date(workspace.current_period_end).toLocaleDateString()}`}
                </p>
                <p className="text-xs text-[var(--color-text-muted)] mt-2">
                  Invoices and payment methods are managed securely through Stripe.
                </p>
              </div>
              <div>
                {workspace.stripe_customer_id ? (
                  <button onClick={handleManage} disabled={saving} className="btn-secondary">Manage billing in Stripe</button>
                ) : null}
              </div>
            </div>
          )}

          <h2 className="text-xl font-bold mb-4">Available Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="card p-6 flex flex-col">
              <h3 className="font-bold text-lg mb-1">Starter</h3>
              <p className="text-3xl font-bold mb-4">$29<span className="text-sm text-[var(--color-text-muted)] font-normal">/mo</span></p>
              <ul className="text-sm space-y-2 mb-6 flex-1 text-[var(--color-text-muted)]">
                <li>• Up to 10 passports</li>
                <li>• No watermark</li>
                <li>• Basic analytics</li>
              </ul>
              {workspace?.plan === 'starter' ? (
                <button disabled className="btn-secondary w-full">Current Plan</button>
              ) : (
                <button onClick={() => handleSubscribe(process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER!)} disabled={saving} className="btn-primary w-full">
                  Upgrade to Starter
                </button>
              )}
            </div>

            <div className="card p-6 flex flex-col border-[var(--color-accent)] shadow-sm relative">
              <div className="absolute top-0 right-0 bg-[var(--color-accent)] text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg rounded-tr-lg uppercase tracking-wider">Most Popular</div>
              <h3 className="font-bold text-lg mb-1">Brand</h3>
              <p className="text-3xl font-bold mb-4">$79<span className="text-sm text-[var(--color-text-muted)] font-normal">/mo</span></p>
              <ul className="text-sm space-y-2 mb-6 flex-1 text-[var(--color-text-muted)]">
                <li>• Up to 50 passports</li>
                <li>• No watermark</li>
                <li>• Shopify integration</li>
                <li>• Team members</li>
              </ul>
              {workspace?.plan === 'brand' ? (
                <button disabled className="btn-secondary w-full">Current Plan</button>
              ) : (
                <button onClick={() => handleSubscribe(process.env.NEXT_PUBLIC_STRIPE_PRICE_BRAND!)} disabled={saving} className="btn-primary w-full">
                  Upgrade to Brand
                </button>
              )}
            </div>

            <div className="card p-6 flex flex-col">
              <h3 className="font-bold text-lg mb-1">Pro</h3>
              <p className="text-3xl font-bold mb-4">$199<span className="text-sm text-[var(--color-text-muted)] font-normal">/mo</span></p>
              <ul className="text-sm space-y-2 mb-6 flex-1 text-[var(--color-text-muted)]">
                <li>• Up to 200 passports</li>
                <li>• No watermark</li>
                <li>• Shopify integration</li>
                <li>• Team members</li>
                <li>• AI Product Data Assistant</li>
              </ul>
              {workspace?.plan === 'pro' ? (
                <button disabled className="btn-secondary w-full">Current Plan</button>
              ) : (
                <button onClick={() => handleSubscribe(process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO!)} disabled={saving} className="btn-primary w-full">
                  Upgrade to Pro
                </button>
              )}
            </div>

          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
