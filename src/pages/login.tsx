import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (loading) return null;
  if (user) {
    router.replace('/dashboard');
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (authError) throw authError;
      
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <>
      <Head><title>Log in — PassportKit</title></Head>
      <Navbar />
      <main className="pt-14 min-h-screen flex items-center justify-center p-5">
        <div className="card p-6 md:p-8 w-full max-w-md">
          <h1 className="text-2xl font-bold mb-2">Log in</h1>
          <p className="text-sm text-[var(--color-text-muted)] mb-6">Welcome back to PassportKit.</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="form-label">Email</label>
              <input required type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@example.com" />
            </div>
            <div>
              <div className="flex justify-between items-center">
                <label className="form-label mb-0">Password</label>
                <a href="/forgot-password" className="text-xs text-[var(--color-accent)] hover:underline">Forgot?</a>
              </div>
              <input required type="password" minLength={6} className="form-input mt-1" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            
            {error && <p className="form-error">{error}</p>}
            
            <button type="submit" disabled={saving} className="btn-primary w-full justify-center">
              {saving ? 'Logging in...' : 'Log in'}
            </button>
            
            <p className="text-center text-sm text-[var(--color-text-muted)] mt-4">
              Don't have an account? <a href="/signup" className="text-[var(--color-accent)] underline">Sign up</a>
            </p>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}
