import Head from 'next/head';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { getDefaultWorkspace } from '@/lib/workspace';
import type { Workspace, PassportRecord } from '@/lib/types';
import Link from 'next/link';

export default function PassportsPage() {
  const { user, loading } = useAuth(true);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [passports, setPassports] = useState<PassportRecord[]>([]);

  useEffect(() => {
    if (user) load();
  }, [user]);

  async function load() {
    if (!user) return;
    const ws = await getDefaultWorkspace(user.id);
    setWorkspace(ws);
    
    if (ws) {
      const { data: pp } = await supabase
        .from('passports')
        .select('*')
        .eq('workspace_id', ws.id)
        .order('created_at', { ascending: false });
        
      if (pp) setPassports(pp);
    }
  }

  if (loading || !user) return null;

  return (
    <>
      <Head><title>My Passports — PassportKit</title></Head>
      <Navbar />
      <main className="pt-14 min-h-screen bg-[var(--color-surface-alt)]">
        <div className="max-w-6xl mx-auto px-5 py-10">
          
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold">My Passports</h1>
            <Link href="/generator" className="btn-primary">Create passport</Link>
          </div>

          <div className="card p-0 overflow-hidden">
            {passports.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-alt)]">
                      <th className="px-5 py-3 font-medium text-[var(--color-text-muted)]">Product</th>
                      <th className="px-5 py-3 font-medium text-[var(--color-text-muted)]">Brand</th>
                      <th className="px-5 py-3 font-medium text-[var(--color-text-muted)]">Completeness</th>
                      <th className="px-5 py-3 font-medium text-[var(--color-text-muted)]">Status</th>
                      <th className="px-5 py-3 font-medium text-[var(--color-text-muted)] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {passports.map(p => (
                      <tr key={p.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-alt)]">
                        <td className="px-5 py-4 font-medium">{p.product_name}</td>
                        <td className="px-5 py-4 text-[var(--color-text-muted)]">{p.brand_name}</td>
                        <td className="px-5 py-4 text-[var(--color-text-muted)]">{p.data_quality_score || 0}%</td>
                        <td className="px-5 py-4">
                          <span className={`badge ${p.status === 'published' ? 'badge-accent' : 'badge-neutral'}`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Link href={`/p/${p.slug}`} className="text-[var(--color-accent)] hover:underline mr-4">View</Link>
                          <Link href={`/edit/${p.slug}?token=${p.edit_token}`} className="text-[var(--color-text-muted)] hover:underline mr-4">Edit</Link>
                          <button onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/p/${p.slug}`);
                            alert('Copied URL');
                          }} className="text-[var(--color-text-muted)] hover:underline">Copy URL</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-[var(--color-text-muted)]">
                No passports created yet. <Link href="/generator" className="text-[var(--color-accent)] underline">Create your first passport</Link>.
              </div>
            )}
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}
