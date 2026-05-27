import Head from 'next/head';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { getDefaultWorkspace } from '@/lib/workspace';
import type { Workspace, WorkspaceMember, WorkspaceInvite } from '@/lib/types';
import { nanoid } from 'nanoid';
import Link from 'next/link';

export default function TeamPage() {
  const { user, loading } = useAuth(true);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [invites, setInvites] = useState<WorkspaceInvite[]>([]);
  
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [inviteLink, setInviteLink] = useState('');

  useEffect(() => {
    if (user) load();
  }, [user]);

  async function load() {
    if (!user) return;
    const ws = await getDefaultWorkspace(user.id);
    setWorkspace(ws);
    
    if (ws) {
      const { data: m } = await supabase
        .from('workspace_members')
        .select('*, profiles(*)')
        .eq('workspace_id', ws.id);
      if (m) setMembers(m);

      const { data: i } = await supabase
        .from('workspace_invites')
        .select('*')
        .eq('workspace_id', ws.id)
        .is('accepted_at', null);
      if (i) setInvites(i);
    }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspace) return;
    setSaving(true);
    setError('');
    setInviteLink('');
    
    try {
      const token = nanoid(32);
      
      const { error: insertError } = await supabase.from('workspace_invites').insert({
        workspace_id: workspace.id,
        email,
        role,
        token
      });
      
      if (insertError) throw insertError;
      
      // We would normally call an API route here to send the email via Resend
      // For this MVP we'll just show the manual link to copy
      const url = `${window.location.origin}/invite/${token}`;
      setInviteLink(url);
      setEmail('');
      
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) return null;

  return (
    <>
      <Head><title>Team — PassportKit</title></Head>
      <Navbar />
      <main className="pt-14 min-h-screen bg-[var(--color-surface-alt)]">
        <div className="max-w-4xl mx-auto px-5 py-10">
          <h1 className="text-2xl font-bold mb-8">Team Members</h1>

          <div className="card p-0 mb-8 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-alt)]">
                  <th className="px-5 py-3 font-medium text-[var(--color-text-muted)]">User</th>
                  <th className="px-5 py-3 font-medium text-[var(--color-text-muted)]">Role</th>
                </tr>
              </thead>
              <tbody>
                {members.map(m => (
                  <tr key={m.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-alt)]">
                    <td className="px-5 py-4 font-medium">{m.profiles?.full_name || m.profiles?.email || m.user_id}</td>
                    <td className="px-5 py-4 capitalize text-[var(--color-text-muted)]">{m.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="text-xl font-bold mb-4">Pending Invites</h2>
          {invites.length > 0 ? (
            <div className="card p-0 mb-8 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-alt)]">
                    <th className="px-5 py-3 font-medium text-[var(--color-text-muted)]">Email</th>
                    <th className="px-5 py-3 font-medium text-[var(--color-text-muted)]">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {invites.map(i => (
                    <tr key={i.id} className="border-b border-[var(--color-border)] last:border-0">
                      <td className="px-5 py-4">{i.email}</td>
                      <td className="px-5 py-4 capitalize text-[var(--color-text-muted)]">{i.role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-[var(--color-text-muted)] mb-8">No pending invites.</p>
          )}

          <div className="card p-6 md:p-8">
            <h2 className="text-lg font-bold mb-1">Invite new member</h2>
            <p className="text-sm text-[var(--color-text-muted)] mb-6">Invite someone to collaborate on your passports.</p>
            
            <form onSubmit={handleInvite} className="space-y-4 max-w-md">
              <div>
                <label className="form-label">Email address</label>
                <input required type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="colleague@example.com" />
              </div>
              <div>
                <label className="form-label">Role</label>
                <select className="form-input" value={role} onChange={e => setRole(e.target.value)}>
                  <option value="member">Member (Create & edit passports)</option>
                  <option value="admin">Admin (Manage integrations & team)</option>
                  <option value="owner">Owner (Full access including billing)</option>
                </select>
              </div>
              
              {error && <p className="form-error">{error}</p>}
              
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Creating invite...' : 'Create invite'}
              </button>
            </form>

            {inviteLink && (
              <div className="mt-6 p-4 border border-[var(--color-accent)] bg-[var(--color-accent-bg)] rounded-lg">
                <p className="text-sm font-bold text-[var(--color-accent)] mb-2">Invite created!</p>
                <p className="text-sm text-[var(--color-text-muted)] mb-2">Since email automation is not fully configured, copy and send this link manually:</p>
                <input readOnly value={inviteLink} className="form-input text-xs font-mono" onClick={e => (e.target as HTMLInputElement).select()} />
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
