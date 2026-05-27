import Head from 'next/head';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { getDefaultWorkspace } from '@/lib/workspace';
import type { Workspace } from '@/lib/types';
import Link from 'next/link';

export default function EmailIntegrationPage() {
  const { user, loading } = useAuth(true);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  
  const [prefs, setPrefs] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
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
      const { data: p } = await supabase.from('email_preferences').select('*').eq('workspace_id', ws.id).single();
      if (p) setPrefs(p);

      const { data: l } = await supabase.from('email_logs').select('*').eq('workspace_id', ws.id).order('created_at', { ascending: false }).limit(20);
      if (l) setLogs(l);
    }
  }

  const togglePref = async (key: string) => {
    if (!workspace || !prefs) return;
    setSaving(true);
    const newValue = !prefs[key];
    try {
      await supabase.from('email_preferences').update({ [key]: newValue }).eq('id', prefs.id);
      setPrefs({ ...prefs, [key]: newValue });
      setMsg('Preferences updated.');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      alert('Failed to update preference');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) return null;

  return (
    <>
      <Head><title>Email Automation — PassportKit</title></Head>
      <Navbar />
      <main className="pt-14 min-h-screen bg-[var(--color-surface-alt)]">
        <div className="max-w-4xl mx-auto px-5 py-10">
          
          <div className="flex items-center mb-8 gap-4">
            <Link href="/dashboard/integrations" className="text-[var(--color-text-muted)] hover:text-black">← Back</Link>
            <h1 className="text-2xl font-bold">Email Automation</h1>
          </div>

          {msg && (
            <div className="mb-6 p-4 rounded-lg bg-[var(--color-accent-bg)] text-[var(--color-accent)]">
              {msg}
            </div>
          )}

          <div className="card p-6 md:p-8 mb-8">
            <h2 className="text-lg font-bold mb-6">Email Preferences</h2>
            {prefs && (
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={prefs.send_team_invite_email} onChange={() => togglePref('send_team_invite_email')} disabled={saving} />
                  <span>Send team invitation emails</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={prefs.send_passport_published_email} onChange={() => togglePref('send_passport_published_email')} disabled={saving} />
                  <span>Send passport published confirmation emails</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={prefs.send_billing_issue_email} onChange={() => togglePref('send_billing_issue_email')} disabled={saving} />
                  <span>Send billing issue alerts</span>
                </label>
              </div>
            )}
          </div>

          <h2 className="text-xl font-bold mb-4">Recent Email Logs</h2>
          <div className="card p-0 overflow-hidden">
            {logs.length > 0 ? (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-alt)]">
                    <th className="px-5 py-3 font-medium text-[var(--color-text-muted)]">Template</th>
                    <th className="px-5 py-3 font-medium text-[var(--color-text-muted)]">To</th>
                    <th className="px-5 py-3 font-medium text-[var(--color-text-muted)]">Status</th>
                    <th className="px-5 py-3 font-medium text-[var(--color-text-muted)]">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-alt)]">
                      <td className="px-5 py-4 font-medium">{log.template.replace(/_/g, ' ')}</td>
                      <td className="px-5 py-4 text-[var(--color-text-muted)]">{log.to_email}</td>
                      <td className="px-5 py-4">
                        <span className={`badge ${log.status === 'sent' ? 'badge-accent' : log.status === 'failed' ? 'bg-red-100 text-red-700' : 'badge-neutral'}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-[var(--color-text-muted)] text-xs">{new Date(log.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-[var(--color-text-muted)]">
                No emails sent yet.
              </div>
            )}
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}
