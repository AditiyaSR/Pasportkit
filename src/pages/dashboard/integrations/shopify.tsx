import Head from 'next/head';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { getDefaultWorkspace } from '@/lib/workspace';
import type { Workspace } from '@/lib/types';
import Link from 'next/link';

export default function ShopifyIntegrationPage() {
  const { user, loading } = useAuth(true);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  
  const [shopDomain, setShopDomain] = useState('');
  const [connection, setConnection] = useState<any>(null);
  const [imports, setImports] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (user) load();
  }, [user]);

  async function load() {
    if (!user) return;
    const ws = await getDefaultWorkspace(user.id);
    setWorkspace(ws);
    
    if (ws) {
      const { data: conn } = await supabase.from('shopify_connections').select('*').eq('workspace_id', ws.id).single();
      if (conn) {
        setConnection(conn);
        const { data: imps } = await supabase.from('shopify_imports').select('*').eq('workspace_id', ws.id).order('created_at', { ascending: false });
        if (imps) setImports(imps);
      }
    }
  }

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspace || !shopDomain) return;
    
    let domain = shopDomain.replace(/https?:\/\//, '').trim();
    if (!domain.includes('.myshopify.com')) {
      domain = `${domain}.myshopify.com`;
    }
    
    window.location.href = `/api/shopify/auth?shop=${domain}&workspaceId=${workspace.id}`;
  };

  const handleImport = async () => {
    if (!workspace || !connection) return;
    setSaving(true);
    setMsg('');
    try {
      const res = await fetch('/api/shopify/import-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId: workspace.id, shopDomain: connection.shop_domain })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMsg(`Successfully imported ${data.imported} products.`);
      load();
    } catch (err: any) {
      setMsg(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCreatePassport = async (importId: string) => {
    if (!workspace) return;
    setSaving(true);
    setMsg('');
    try {
      const res = await fetch('/api/shopify/create-passport-from-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId: workspace.id, importId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.location.href = `/edit/${data.slug}`;
    } catch (err: any) {
      setMsg(`Error: ${err.message}`);
      setSaving(false);
    }
  };

  if (loading || !user) return null;

  return (
    <>
      <Head><title>Shopify Integration — PassportKit</title></Head>
      <Navbar />
      <main className="pt-14 min-h-screen bg-[var(--color-surface-alt)]">
        <div className="max-w-4xl mx-auto px-5 py-10">
          
          <div className="flex items-center mb-8 gap-4">
            <Link href="/dashboard/integrations" className="text-[var(--color-text-muted)] hover:text-black">← Back</Link>
            <h1 className="text-2xl font-bold">Shopify Integration</h1>
          </div>

          {msg && (
            <div className="mb-6 p-4 rounded-lg bg-[var(--color-accent-bg)] text-[var(--color-accent)]">
              {msg}
            </div>
          )}

          {!connection ? (
            <div className="card p-6 md:p-8 mb-8">
              <h2 className="text-lg font-bold mb-2">Connect Store</h2>
              <p className="text-sm text-[var(--color-text-muted)] mb-6">Enter your Shopify store domain to connect. You must be on the Brand or Pro plan.</p>
              
              <form onSubmit={handleConnect} className="flex gap-4">
                <input 
                  required 
                  className="form-input flex-1" 
                  value={shopDomain} 
                  onChange={e => setShopDomain(e.target.value)} 
                  placeholder="your-store.myshopify.com" 
                />
                <button type="submit" className="btn-primary">Connect Shopify</button>
              </form>
            </div>
          ) : (
            <>
              <div className="card p-6 mb-8 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold">Connected to {connection.shop_domain}</h2>
                  <p className="text-sm text-[var(--color-text-muted)] mt-1">Ready to import and sync.</p>
                </div>
                <button onClick={handleImport} disabled={saving} className="btn-primary">
                  {saving ? 'Importing...' : 'Import Products'}
                </button>
              </div>

              {imports.length > 0 && (
                <div className="card p-0 overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-alt)]">
                        <th className="px-5 py-3 font-medium text-[var(--color-text-muted)]">Product</th>
                        <th className="px-5 py-3 font-medium text-[var(--color-text-muted)]">Type</th>
                        <th className="px-5 py-3 font-medium text-[var(--color-text-muted)] text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {imports.map(imp => (
                        <tr key={imp.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-alt)]">
                          <td className="px-5 py-4 font-medium flex items-center gap-3">
                            {imp.image_url ? (
                              <img src={imp.image_url} alt="" className="w-8 h-8 rounded object-cover" />
                            ) : (
                              <div className="w-8 h-8 rounded bg-gray-200" />
                            )}
                            {imp.title}
                          </td>
                          <td className="px-5 py-4 text-[var(--color-text-muted)]">{imp.product_type || '—'}</td>
                          <td className="px-5 py-4 text-right">
                            {imp.passport_id ? (
                              <span className="text-[var(--color-text-muted)] text-xs">Passport created</span>
                            ) : (
                              <button onClick={() => handleCreatePassport(imp.id)} disabled={saving} className="text-[var(--color-accent)] hover:underline font-medium">
                                Create Passport
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

        </div>
      </main>
      <Footer />
    </>
  );
}
