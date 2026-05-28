import { NextApiRequest, NextApiResponse } from 'next';
import { getServiceSupabase } from './supabase';
import type { User } from '@supabase/supabase-js';

export async function getAuthUser(req: NextApiRequest): Promise<User | null> {
  // Try to get token from Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  if (!token) return null;

  try {
    const adminClient = getServiceSupabase();
    const { data: { user }, error } = await adminClient.auth.getUser(token);
    if (error || !user) return null;
    return user;
  } catch {
    return null;
  }
}

export function requireAuth(handler: (req: NextApiRequest, res: NextApiResponse, user: User) => Promise<void>) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const user = await getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return handler(req, res, user);
  };
}
