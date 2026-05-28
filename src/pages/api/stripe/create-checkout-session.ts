import { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '@/lib/server-auth';
import { getServiceSupabase } from '@/lib/supabase';
import { createCheckoutSession } from '@/lib/stripe';
import { hasWorkspacePermission } from '@/lib/permissions';

const PLAN_PRICE_ENV: Record<string, string> = {
  starter: 'STRIPE_PRICE_STARTER',
  brand: 'STRIPE_PRICE_BRAND',
  pro: 'STRIPE_PRICE_PRO',
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  
  await requireAuth(async (req, res, user) => {
    try {
      const { plan, workspaceId } = req.body;
      if (!plan || !workspaceId) return res.status(400).json({ error: 'Missing fields' });

      const priceEnvName = PLAN_PRICE_ENV[String(plan).toLowerCase()];
      const priceId = priceEnvName ? process.env[priceEnvName] : null;
      if (!priceId) return res.status(400).json({ error: 'Stripe price is not configured for this plan' });

      const adminClient = getServiceSupabase();
      
      // Verify membership and role
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

      const url = await createCheckoutSession(priceId, workspaceId, workspace?.stripe_customer_id);
      res.status(200).json({ url });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  })(req, res);
}
