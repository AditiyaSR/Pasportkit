import { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '@/lib/server-auth';
import { getServiceSupabase } from '@/lib/supabase';
import { createPortalSession } from '@/lib/stripe';
import { hasWorkspacePermission } from '@/lib/permissions';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  
  await requireAuth(async (req, res, user) => {
    try {
      const { workspaceId } = req.body;
      if (!workspaceId) return res.status(400).json({ error: 'Missing fields' });

      const adminClient = getServiceSupabase();
      
      const { data: member } = await adminClient
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', workspaceId)
        .eq('user_id', user.id)
        .single();
        
      if (!member || !hasWorkspacePermission(member.role, 'manage_billing')) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const { data: workspace } = await adminClient
        .from('workspaces')
        .select('stripe_customer_id')
        .eq('id', workspaceId)
        .single();

      if (!workspace?.stripe_customer_id) {
        return res.status(400).json({ error: 'No active Stripe customer' });
      }

      const url = await createPortalSession(workspace.stripe_customer_id);
      res.status(200).json({ url });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  })(req, res);
}
