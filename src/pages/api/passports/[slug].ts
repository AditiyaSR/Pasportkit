import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase, getServiceSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { PUBLIC_PASSPORT_SELECT } from '@/lib/public-passport';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!isSupabaseConfigured()) {
    return res.status(500).json({ error: 'Supabase is not configured.' });
  }

  const { slug } = req.query;
  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ error: 'Missing slug' });
  }

  try {
    let data = null;
    let error = null;

    try {
      const adminClient = getServiceSupabase();
      const result = await adminClient
        .from('passports')
        .select(PUBLIC_PASSPORT_SELECT)
        .eq('slug', slug)
        .eq('visibility', 'public')
        .eq('status', 'published')
        .single();
      data = result.data;
      error = result.error;
    } catch {
      error = new Error('Service role fetch unavailable');
    }

    if (error || !data) {
      const fallback = await supabase
        .from('passports')
        .select(PUBLIC_PASSPORT_SELECT)
        .eq('slug', slug)
        .eq('visibility', 'public')
        .eq('status', 'published')
        .single();
      data = fallback.data;
      error = fallback.error;
    }

    if (error || !data) {
      return res.status(404).json({ error: 'Passport not found' });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error('Fetch passport error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
