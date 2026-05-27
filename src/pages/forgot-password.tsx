import Head from 'next/head';
import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/dashboard`,
      });
      if (resetError) throw resetError;
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Head><title>Forgot Password — PassportKit</title></Head>
      <Navbar />
      <main className="pt-14 min-h-screen flex items-center justify-center p-5">
        <div className="card p-6 md:p-8 w-full max-w-md">
          <h1 className="text-2xl font-bold mb-2">Reset password</h1>
          <p className="text-sm text-[var(--color-text-muted)] mb-6">Enter your email to receive a password reset link.</p>
          
          {success ? (
            <div className="p-4 rounded-lg bg-[var(--color-accent-bg)] text-[var(--color-accent)] text-center">
              Password reset link sent! Check your inbox.
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="form-label">Email</label>
                <input required type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@example.com" />
              </div>
              {error && <p className="form-error">{error}</p>}
              <button type="submit" disabled={saving} className="btn-primary w-full justify-center">
                {saving ? 'Sending...' : 'Send reset link'}
              </button>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
