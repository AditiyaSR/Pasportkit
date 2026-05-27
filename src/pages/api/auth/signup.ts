import { NextApiRequest, NextApiResponse } from 'next';
import { supabase, getServiceSupabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, password, full_name } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (authError) throw authError;
    if (!authData.user) throw new Error('Failed to create user');

    const user = authData.user;
    const adminClient = getServiceSupabase();

    // Create profile
    await adminClient.from('profiles').upsert({
      id: user.id,
      email,
      full_name,
    });

    // Create default workspace
    const workspaceName = full_name ? `${full_name}'s Workspace` : 'My Workspace';
    const slug = `${workspaceName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Math.random().toString(36).substring(7)}`;

    const { data: workspaceData, error: wsError } = await adminClient.from('workspaces').insert({
      name: workspaceName,
      slug,
      owner_id: user.id,
      plan: 'free',
      subscription_status: 'free'
    }).select().single();

    if (wsError) throw wsError;

    // Add owner member
    await adminClient.from('workspace_members').insert({
      workspace_id: workspaceData.id,
      user_id: user.id,
      role: 'owner'
    });

    // Default email prefs
    await adminClient.from('email_preferences').insert({
      workspace_id: workspaceData.id
    });

    res.status(200).json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
