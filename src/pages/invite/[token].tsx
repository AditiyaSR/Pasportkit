import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export default function InvitePage() {
  const router = useRouter();
  const { token } = router.query;
  const { user, loading } = useAuth(false);
  
  const [invite, setInvite] = useState<any>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (token && typeof token === 'string') {
      verifyInvite(token);
    }
  }, [token]);

  async function verifyInvite(t: string) {
    const { data, error } = await supabase
      .from('workspace_invites')
      .select('*, workspaces(name)')
      .eq('token', t)
      .is('accepted_at', null)
      .single();
      
    if (error || !data) {
      setError('Invite link is invalid, expired, or already accepted.');
    } else {
      setInvite(data);
    }
  }

  const handleAccept = async () => {
    if (!user) {
      router.push(`/login?next=/invite/${token}`);
      return;
    }
    
    setSaving(true);
    try {
      const { error: insertError } = await supabase.from('workspace_members').insert({
        workspace_id: invite.workspace_id,
        user_id: user.id,
        role: invite.role
      });
      if (insertError) throw insertError;
      
      await supabase.from('workspace_invites').update({
        accepted_at: new Date().toISOString()
      }).eq('id', invite.id);
      
      setSuccess(true);
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <>
      <Head><title>Accept Invite — PassportKit</title></Head>
      <Navbar />
      <main className="pt-14 min-h-screen flex items-center justify-center p-5">
        <div className="card p-6 md:p-8 w-full max-w-md text-center">
          
          {error ? (
            <div>
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </div>
              <h1 className="text-xl font-bold mb-2">Invalid Invite</h1>
              <p className="text-sm text-[var(--color-text-muted)] mb-6">{error}</p>
              <button onClick={() => router.push('/')} className="btn-secondary w-full">Go home</button>
            </div>
          ) : !invite ? (
            <p>Loading invite details...</p>
          ) : success ? (
            <div className="p-4 rounded-lg bg-[var(--color-accent-bg)] text-[var(--color-accent)]">
              Welcome to the team! Redirecting to dashboard...
            </div>
          ) : (
            <div>
              <h1 className="text-2xl font-bold mb-2">You've been invited</h1>
              <p className="text-sm text-[var(--color-text-muted)] mb-6">
                You have been invited to join the <strong>{invite.workspaces?.name}</strong> workspace on PassportKit.
              </p>
              
              {!user ? (
                <div className="space-y-4">
                  <p className="text-sm">Please log in or create an account to accept.</p>
                  <button onClick={() => router.push(`/login?next=/invite/${token}`)} className="btn-primary w-full justify-center">Log in</button>
                  <button onClick={() => router.push(`/signup?next=/invite/${token}`)} className="btn-secondary w-full justify-center">Sign up</button>
                </div>
              ) : (
                <button onClick={handleAccept} disabled={saving} className="btn-primary w-full justify-center">
                  {saving ? 'Accepting...' : 'Accept Invite'}
                </button>
              )}
            </div>
          )}

        </div>
      </main>
      <Footer />
    </>
  );
}
