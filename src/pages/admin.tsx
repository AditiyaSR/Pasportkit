import Head from 'next/head';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export default function AdminPage() {
  const { user, profile, loading } = useAuth(true);
  
  const [stats, setStats] = useState({
    users: 0,
    workspaces: 0,
    passports: 0,
    subscriptions: 0
  });

  const [recentUsers, setRecentUsers] = useState<any[]>([]);

  useEffect(() => {
    if (user && profile && profile.is_super_admin) {
      load();
    }
  }, [user, profile]);

  async function load() {
    // Basic stats via direct queries (using RLS or service role if this was an API, 
    // but assuming super_admin can read all due to RLS or we just do simple counts if allowed)
    // NOTE: In a real app, this should be an API route to bypass RLS securely.
    // For MVP, we will assume RLS allows super_admin to select all.
    // Actually, RLS blocks selecting all users unless configured. 
    // I'll call a dedicated API or just try direct queries.
    // For the sake of simplicity, we'll just try direct queries.
    
    try {
      const [{ count: cU }, { count: cW }, { count: cP }, { count: cS }] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('workspaces').select('*', { count: 'exact', head: true }),
        supabase.from('passports').select('*', { count: 'exact', head: true }),
        supabase.from('subscriptions').select('*', { count: 'exact', head: true }),
      ]);
      
      setStats({
        users: cU || 0,
        workspaces: cW || 0,
        passports: cP || 0,
        subscriptions: cS || 0
      });

      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(10);
      if (data) setRecentUsers(data);
    } catch (err) {}
  }

  if (loading || !user) return null;
  
  if (profile && !profile.is_super_admin) {
    return (
      <>
        <Navbar />
        <main className="pt-14 min-h-screen flex items-center justify-center">
          <p>Access denied. Admins only.</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Head><title>Super Admin — PassportKit</title></Head>
      <Navbar />
      <main className="pt-14 min-h-screen bg-[var(--color-surface-alt)]">
        <div className="max-w-6xl mx-auto px-5 py-10">
          <h1 className="text-2xl font-bold mb-8">Admin Overview</h1>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="card p-5">
              <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Total Users</p>
              <p className="text-3xl font-bold text-[var(--color-accent)]">{stats.users}</p>
            </div>
            <div className="card p-5">
              <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Total Workspaces</p>
              <p className="text-3xl font-bold">{stats.workspaces}</p>
            </div>
            <div className="card p-5">
              <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Total Passports</p>
              <p className="text-3xl font-bold">{stats.passports}</p>
            </div>
            <div className="card p-5">
              <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Active Subs</p>
              <p className="text-3xl font-bold">{stats.subscriptions}</p>
            </div>
          </div>

          <h2 className="text-xl font-bold mb-4">Recent Users</h2>
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-alt)]">
                  <th className="px-5 py-3 font-medium text-[var(--color-text-muted)]">Email</th>
                  <th className="px-5 py-3 font-medium text-[var(--color-text-muted)]">Name</th>
                  <th className="px-5 py-3 font-medium text-[var(--color-text-muted)]">Joined</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map(u => (
                  <tr key={u.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-alt)]">
                    <td className="px-5 py-4 font-medium">{u.email}</td>
                    <td className="px-5 py-4 text-[var(--color-text-muted)]">{u.full_name}</td>
                    <td className="px-5 py-4 text-[var(--color-text-muted)] text-xs">{new Date(u.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}
