import Head from 'next/head';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { getDefaultWorkspace } from '@/lib/workspace';
import type { Workspace } from '@/lib/types';
import Link from 'next/link';

export default function AiIntegrationPage() {
  const { user, loading } = useAuth(true);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    if (user) load();
  }, [user]);

  async function load() {
    if (!user) return;
    const ws = await getDefaultWorkspace(user.id);
    setWorkspace(ws);
    
    if (ws) {
      const { data: l } = await supabase.from('ai_logs').select('*').eq('workspace_id', ws.id).order('created_at', { ascending: false }).limit(20);
      if (l) setLogs(l);
    }
  }

  if (loading || !user) return null;

  return (
    <>
      <Head><title>AI Integration — PassportKit</title></Head>
      <Navbar />
      <main className="pt-14 min-h-screen bg-[var(--color-surface-alt)]">
        <div className="max-w-4xl mx-auto px-5 py-10">
          
          <div className="flex items-center mb-8 gap-4">
            <Link href="/dashboard/integrations" className="text-[var(--color-text-muted)] hover:text-black">← Back</Link>
            <h1 className="text-2xl font-bold">AI Product Data Assistant</h1>
          </div>

          <div className="card p-6 md:p-8 mb-8">
            <h2 className="text-lg font-bold mb-2">Status</h2>
            <p className="text-sm text-[var(--color-text-muted)] mb-4">
              AI suggestions are enabled for generating product fields in the passport generator.
            </p>
            <div className="flex items-center gap-3">
              <span className={`badge ${workspace?.plan === 'pro' ? 'badge-accent' : 'badge-neutral'}`}>
                {workspace?.plan === 'pro' ? 'Available' : 'Requires Pro'}
              </span>
            </div>
            {workspace?.plan !== 'pro' && process.env.NODE_ENV !== 'development' && (
              <div className="mt-6">
                <Link href="/dashboard/billing" className="btn-primary">Upgrade to Pro</Link>
              </div>
            )}
          </div>

          <h2 className="text-xl font-bold mb-4">Recent AI Logs</h2>
          <div className="card p-0 overflow-hidden">
            {logs.length > 0 ? (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-alt)]">
                    <th className="px-5 py-3 font-medium text-[var(--color-text-muted)]">Action</th>
                    <th className="px-5 py-3 font-medium text-[var(--color-text-muted)]">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-alt)]">
                      <td className="px-5 py-4 font-medium">{log.action}</td>
                      <td className="px-5 py-4 text-[var(--color-text-muted)] text-xs">{new Date(log.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-[var(--color-text-muted)]">
                No AI usage yet. AI suggestions can be generated directly inside the passport generator.
              </div>
            )}
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}
