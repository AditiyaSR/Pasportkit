import Head from 'next/head';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { getDefaultWorkspace } from '@/lib/workspace';
import { getPlanLimits } from '@/lib/billing';
import type { Workspace, PassportRecord } from '@/lib/types';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, profile, loading } = useAuth(true);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [passports, setPassports] = useState<PassportRecord[]>([]);
  const [stats, setStats] = useState({ total: 0, published: 0, avgQuality: 0 });

  useEffect(() => {
    if (user) {
      loadDashboard();
    }
  }, [user]);

  async function loadDashboard() {
    if (!user) return;
    const ws = await getDefaultWorkspace(user.id);
    setWorkspace(ws);
    
    if (ws) {
      const { data: workspacePassports } = await supabase
        .from('passports')
        .select('*')
        .eq('workspace_id', ws.id)
        .order('created_at', { ascending: false });

      const { data: legacyPassports } = await supabase
        .from('passports')
        .select('*')
        .eq('user_id', user.id)
        .is('workspace_id', null)
        .order('created_at', { ascending: false });
        
      if (workspacePassports) {
        const pp = [...workspacePassports, ...(legacyPassports || [])];
        setPassports(pp);
        const published = workspacePassports.filter(p => p.status === 'published').length;
        const totalQuality = workspacePassports.reduce((acc, p) => acc + (p.data_quality_score || 0), 0);
        setStats({
          total: workspacePassports.length,
          published,
          avgQuality: workspacePassports.length ? Math.round(totalQuality / workspacePassports.length) : 0,
        });
      }
    }
  }

  if (loading || !user) return null;

  const limits = workspace ? getPlanLimits(workspace.plan) : getPlanLimits('free');
  const usagePct = stats.total > 0 ? Math.min(100, Math.round((stats.total / limits.max_passports) * 100)) : 0;

  return (
    <>
      <Head><title>Dashboard — PassportKit</title></Head>
      <Navbar />
      <main className="pt-14 min-h-screen bg-[var(--color-surface-alt)]">
        <div className="max-w-6xl mx-auto px-5 py-10">
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold">Welcome, {profile?.full_name || user.email}</h1>
              <p className="text-sm text-[var(--color-text-muted)] mt-1">{workspace?.name} Workspace — {workspace?.plan.toUpperCase()} Plan</p>
            </div>
            <div className="flex gap-3">
              <Link href="/dashboard/passports" className="btn-secondary">My Passports</Link>
              <Link href="/generator" className="btn-primary">Create passport</Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="card p-5">
              <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Total Passports</p>
              <p className="text-3xl font-bold">{stats.total}</p>
            </div>
            <div className="card p-5">
              <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Published</p>
              <p className="text-3xl font-bold text-[var(--color-accent)]">{stats.published}</p>
            </div>
            <div className="card p-5">
              <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Avg. Completeness</p>
              <p className="text-3xl font-bold">{stats.avgQuality}%</p>
            </div>
            <div className="card p-5 bg-[var(--color-accent-bg)] border-[var(--color-accent)]">
              <p className="text-xs font-semibold text-[var(--color-accent)] uppercase tracking-wider mb-2">Plan Usage</p>
              <p className="text-3xl font-bold text-[var(--color-accent)] mb-2">{stats.total} / {limits.max_passports}</p>
              <div className="w-full bg-[var(--color-surface)] h-2 rounded-full overflow-hidden">
                <div className="bg-[var(--color-accent)] h-full" style={{ width: `${usagePct}%` }} />
              </div>
            </div>
          </div>

          <h2 className="text-lg font-bold mb-4">Recent Passports</h2>
          <div className="card p-0 overflow-hidden">
            {passports.length > 0 ? (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-alt)]">
                    <th className="px-5 py-3 font-medium text-[var(--color-text-muted)]">Product</th>
                    <th className="px-5 py-3 font-medium text-[var(--color-text-muted)]">Category</th>
                    <th className="px-5 py-3 font-medium text-[var(--color-text-muted)]">Status</th>
                    <th className="px-5 py-3 font-medium text-[var(--color-text-muted)] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {passports.slice(0, 5).map(p => (
                    <tr key={p.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-alt)]">
                      <td className="px-5 py-4 font-medium">{p.product_name}</td>
                      <td className="px-5 py-4 text-[var(--color-text-muted)]">{p.category || '—'}</td>
                      <td className="px-5 py-4">
                        <span className={`badge ${p.status === 'published' ? 'badge-accent' : 'badge-neutral'}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link href={`/p/${p.slug}`} className="text-[var(--color-accent)] hover:underline mr-4">View</Link>
                        <Link href={`/edit/${p.slug}?token=${p.edit_token}`} className="text-[var(--color-text-muted)] hover:underline">Edit</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-[var(--color-text-muted)]">
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
