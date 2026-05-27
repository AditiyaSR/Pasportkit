import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth';

export default function SignupPage() {
  const router = useRouter();
  const { user, loading } = useAuth(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (loading) return null;
  if (user) {
    router.replace('/dashboard');
    return null;
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name: fullName }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to sign up');
      
      setSuccess(true);
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <>
      <Head><title>Sign up — PassportKit</title></Head>
      <Navbar />
      <main className="pt-14 min-h-screen flex items-center justify-center p-5">
        <div className="card p-6 md:p-8 w-full max-w-md">
          <h1 className="text-2xl font-bold mb-2">Create an account</h1>
          <p className="text-sm text-[var(--color-text-muted)] mb-6">Start creating digital product passports for your brand.</p>
          
          {success ? (
            <div className="p-4 rounded-lg bg-[var(--color-accent-bg)] text-[var(--color-accent)] text-center">
              Account created successfully! Redirecting...
            </div>
          ) : (
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="form-label">Full Name</label>
                <input required className="form-input" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Jane Doe" />
              </div>
              <div>
                <label className="form-label">Email</label>
                <input required type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@example.com" />
              </div>
              <div>
                <label className="form-label">Password</label>
                <input required type="password" minLength={6} className="form-input" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
              </div>
              
              {error && <p className="form-error">{error}</p>}
              
              <button type="submit" disabled={saving} className="btn-primary w-full justify-center">
                {saving ? 'Creating account...' : 'Sign up'}
              </button>
              
              <p className="text-center text-sm text-[var(--color-text-muted)] mt-4">
                Already have an account? <a href="/login" className="text-[var(--color-accent)] underline">Log in</a>
              </p>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
