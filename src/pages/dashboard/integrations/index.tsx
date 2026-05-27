import Head from 'next/head';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { getDefaultWorkspace } from '@/lib/workspace';
import type { Workspace } from '@/lib/types';
import Link from 'next/link';

export default function IntegrationsPage() {
  const { user, loading } = useAuth(true);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  
  const [shopifyConnected, setShopifyConnected] = useState(false);

  useEffect(() => {
    if (user) load();
  }, [user]);

  async function load() {
    if (!user) return;
    const ws = await getDefaultWorkspace(user.id);
    setWorkspace(ws);
    
    if (ws) {
      const { data: conn } = await supabase.from('shopify_connections').select('id').eq('workspace_id', ws.id).single();
      if (conn) setShopifyConnected(true);
    }
  }

  if (loading || !user) return null;

  return (
    <>
      <Head><title>Integrations — PassportKit</title></Head>
      <Navbar />
      <main className="pt-14 min-h-screen bg-[var(--color-surface-alt)]">
        <div className="max-w-4xl mx-auto px-5 py-10">
          <h1 className="text-2xl font-bold mb-8">Integrations</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="card p-6 flex flex-col items-start">
              <h3 className="font-bold text-lg mb-2">Shopify</h3>
              <p className="text-sm text-[var(--color-text-muted)] mb-6 flex-1">
                Import products directly from your Shopify store and automatically sync passport URLs back to product metafields.
              </p>
              <div className="flex items-center gap-3 w-full">
                <span className={`badge ${shopifyConnected ? 'badge-accent' : 'badge-neutral'}`}>
                  {shopifyConnected ? 'Connected' : 'Not connected'}
                </span>
                <Link href="/dashboard/integrations/shopify" className="btn-secondary ml-auto">Manage</Link>
              </div>
            </div>

            <div className="card p-6 flex flex-col items-start">
              <h3 className="font-bold text-lg mb-2">AI Product Data Assistant</h3>
              <p className="text-sm text-[var(--color-text-muted)] mb-6 flex-1">
                Speed up passport creation by generating suggested compliance fields and care instructions based on product details.
              </p>
              <div className="flex items-center gap-3 w-full mt-auto">
                <span className={`badge ${workspace?.plan === 'pro' ? 'badge-accent' : 'badge-neutral'}`}>
                  {workspace?.plan === 'pro' ? 'Available' : 'Requires Pro'}
                </span>
                <Link href="/dashboard/integrations/ai" className="btn-secondary ml-auto">Manage</Link>
              </div>
            </div>

            <div className="card p-6 flex flex-col items-start">
              <h3 className="font-bold text-lg mb-2">Email Automation</h3>
              <p className="text-sm text-[var(--color-text-muted)] mb-6 flex-1">
                Configure automated emails for team invites, passport publications, and billing notices.
              </p>
              <div className="flex items-center gap-3 w-full mt-auto">
                <Link href="/dashboard/integrations/email" className="btn-secondary ml-auto">Manage</Link>
              </div>
            </div>

          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
