import Head from 'next/head';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth, signOut } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { getDefaultWorkspace } from '@/lib/workspace';
import type { Workspace } from '@/lib/types';

export default function SettingsPage() {
  const { user, profile, loading } = useAuth(true);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  
  const [fullName, setFullName] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (user && profile) {
      setFullName(profile.full_name || '');
      loadWorkspace();
    }
  }, [user, profile]);

  async function loadWorkspace() {
    if (!user) return;
    const ws = await getDefaultWorkspace(user.id);
    if (ws) {
      setWorkspace(ws);
      setWorkspaceName(ws.name);
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setMsg('');
    try {
      await supabase.from('profiles').update({ full_name: fullName }).eq('id', user.id);
      setMsg('Profile saved');
    } catch (err: any) {
      setMsg(`Error: ${err.message}`);
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(''), 3000);
    }
  };

  const handleSaveWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspace) return;
    setSaving(true);
    setMsg('');
    try {
      await supabase.from('workspaces').update({ name: workspaceName }).eq('id', workspace.id);
      setMsg('Workspace saved');
    } catch (err: any) {
      setMsg(`Error: ${err.message}`);
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(''), 3000);
    }
  };

  if (loading || !user) return null;

  return (
    <>
      <Head><title>Settings — PassportKit</title></Head>
      <Navbar />
      <main className="pt-14 min-h-screen bg-[var(--color-surface-alt)]">
        <div className="max-w-4xl mx-auto px-5 py-10">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold">Settings</h1>
            <button onClick={signOut} className="btn-secondary">Log out</button>
          </div>

          {msg && (
            <div className="mb-6 p-4 rounded-lg bg-[var(--color-accent-bg)] text-[var(--color-accent)]">
              {msg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="card p-6 md:p-8">
              <h2 className="text-lg font-bold mb-1">Personal Profile</h2>
              <p className="text-sm text-[var(--color-text-muted)] mb-6">Update your personal details.</p>
              
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="form-label">Email</label>
                  <input type="email" disabled className="form-input bg-gray-50 text-gray-500" value={user.email} />
                </div>
                <div>
                  <label className="form-label">Full Name</label>
                  <input required className="form-input" value={fullName} onChange={e => setFullName(e.target.value)} />
                </div>
                <button type="submit" disabled={saving} className="btn-primary">Save Profile</button>
              </form>
            </div>

            <div className="card p-6 md:p-8">
              <h2 className="text-lg font-bold mb-1">Workspace Settings</h2>
              <p className="text-sm text-[var(--color-text-muted)] mb-6">Manage your workspace details.</p>
              
              {workspace && (
                <form onSubmit={handleSaveWorkspace} className="space-y-4">
                  <div>
                    <label className="form-label">Workspace Name</label>
                    <input required className="form-input" value={workspaceName} onChange={e => setWorkspaceName(e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">Workspace URL Slug</label>
                    <input type="text" disabled className="form-input bg-gray-50 text-gray-500" value={workspace.slug} />
                  </div>
                  <button type="submit" disabled={saving} className="btn-primary">Save Workspace</button>
                </form>
              )}
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}
