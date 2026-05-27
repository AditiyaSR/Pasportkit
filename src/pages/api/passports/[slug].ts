import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

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
    const { data, error } = await supabase
      .from('passports')
      .select('*')
      .eq('slug', slug)
      .eq('visibility', 'public')
      .eq('status', 'published')
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Passport not found' });
    }

    // Remove edit_token from public response
    const { edit_token, ...publicData } = data;
    return res.status(200).json(publicData);
  } catch (err) {
    console.error('Fetch passport error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
