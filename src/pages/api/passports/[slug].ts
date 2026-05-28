import type { NextApiRequest, NextApiResponse } from 'next';
import { getServiceSupabase, isSupabaseConfigured } from '@/lib/supabase';
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
    const adminClient = getServiceSupabase();
    const { data, error } = await adminClient
      .from('passports')
      .select(PUBLIC_PASSPORT_SELECT)
      .eq('slug', slug)
      .eq('visibility', 'public')
      .eq('status', 'published')
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Passport not found' });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error('Fetch passport error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
