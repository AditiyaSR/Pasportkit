import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';
import type { Profile } from './types';

export function useAuth(requireAuth = true) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    async function getSession() {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        if (mounted) {
          setUser(null);
          setProfile(null);
          setLoading(false);
          if (requireAuth) {
            router.replace('/login');
          }
        }
        return;
      }

      if (mounted) {
        setUser(session.user);
        // Fetch profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        setProfile(profileData || null);
        setLoading(false);
      }
    }

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        if (session) {
          setUser(session.user);
        } else {
          setUser(null);
          setProfile(null);
          if (requireAuth) {
            router.replace('/login');
          }
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [requireAuth, router]);

  return { user, profile, loading };
}

export async function signOut() {
  await supabase.auth.signOut();
  window.location.href = '/login';
}
