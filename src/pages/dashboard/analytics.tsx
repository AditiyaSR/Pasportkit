import Head from 'next/head';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { getDefaultWorkspace } from '@/lib/workspace';
import type { Workspace } from '@/lib/types';

export default function AnalyticsPage() {
  const { user, loading } = useAuth(true);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  
  const [stats, setStats] = useState({
    views: 0,
    qr_downloads: 0,
    pdf_downloads: 0,
    json_exports: 0,
  });
  
  const [recentEvents, setRecentEvents] = useState<any[]>([]);

  useEffect(() => {
    if (user) load();
  }, [user]);

  async function load() {
    if (!user) return;
    const ws = await getDefaultWorkspace(user.id);
    setWorkspace(ws);
    
    if (ws) {
      // Aggregate stats
      const { data: events } = await supabase
        .from('passport_events')
        .select('event_type, passports(product_name), created_at')
        .eq('workspace_id', ws.id)
        .order('created_at', { ascending: false })
        .limit(1000);
        
      if (events) {
        let views = 0;
        let qr = 0;
        let pdf = 0;
        let json = 0;
        
        events.forEach(e => {
          if (e.event_type === 'passport_viewed') views++;
          if (e.event_type === 'qr_downloaded') qr++;
          if (e.event_type === 'pdf_downloaded') pdf++;
          if (e.event_type === 'json_exported') json++;
        });
        
        setStats({ views, qr_downloads: qr, pdf_downloads: pdf, json_exports: json });
        setRecentEvents(events.slice(0, 10));
      }
    }
  }

  if (loading || !user) return null;

  return (
    <>
      <Head><title>Analytics — PassportKit</title></Head>
      <Navbar />
      <main className="pt-14 min-h-screen bg-[var(--color-surface-alt)]">
        <div className="max-w-6xl mx-auto px-5 py-10">
          <h1 className="text-2xl font-bold mb-8">Analytics</h1>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="card p-5">
              <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Total Views</p>
              <p className="text-3xl font-bold text-[var(--color-accent)]">{stats.views}</p>
            </div>
            <div className="card p-5">
              <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">QR Downloads</p>
              <p className="text-3xl font-bold">{stats.qr_downloads}</p>
            </div>
            <div className="card p-5">
              <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">PDF Downloads</p>
              <p className="text-3xl font-bold">{stats.pdf_downloads}</p>
            </div>
            <div className="card p-5">
              <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">JSON Exports</p>
              <p className="text-3xl font-bold">{stats.json_exports}</p>
            </div>
          </div>

          <h2 className="text-xl font-bold mb-4">Recent Events</h2>
          <div className="card p-0 overflow-hidden">
            {recentEvents.length > 0 ? (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-alt)]">
                    <th className="px-5 py-3 font-medium text-[var(--color-text-muted)]">Event</th>
                    <th className="px-5 py-3 font-medium text-[var(--color-text-muted)]">Product</th>
                    <th className="px-5 py-3 font-medium text-[var(--color-text-muted)]">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentEvents.map((ev, idx) => (
                    <tr key={idx} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-alt)]">
                      <td className="px-5 py-4 font-medium text-[var(--color-text-muted)]">{ev.event_type.replace(/_/g, ' ')}</td>
                      <td className="px-5 py-4">{ev.passports?.product_name || '—'}</td>
                      <td className="px-5 py-4 text-[var(--color-text-muted)] text-xs">{new Date(ev.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-[var(--color-text-muted)]">
                No activity yet.
              </div>
            )}
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}
