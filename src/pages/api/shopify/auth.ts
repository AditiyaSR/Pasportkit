import { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '@/lib/server-auth';
import { getShopifyConfig, isShopifyConfigured } from '@/lib/shopify';
import { getServiceSupabase } from '@/lib/supabase';
import { hasWorkspacePermission } from '@/lib/permissions';
import crypto from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  
  await requireAuth(async (req, res, user) => {
    if (!isShopifyConfigured()) {
      return res.status(400).json({ error: 'Shopify is not configured' });
    }

    const { shop, workspaceId } = req.query;
    if (!shop || !workspaceId || typeof shop !== 'string' || typeof workspaceId !== 'string') {
      return res.status(400).json({ error: 'Missing shop or workspaceId' });
    }

    const adminClient = getServiceSupabase();
    const { data: member } = await adminClient.from('workspace_members').select('role').eq('workspace_id', workspaceId).eq('user_id', user.id).single();
    
    if (!member || !hasWorkspacePermission(member.role, 'manage_integrations')) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const config = getShopifyConfig();
    const state = crypto.randomBytes(16).toString('hex');
    const redirectUri = `${config.appUrl}/api/shopify/callback`;
    
    // Store state in cookie to verify later
    res.setHeader('Set-Cookie', `shopify_state_${workspaceId}=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600`);

    const authUrl = `https://${shop}/admin/oauth/authorize?client_id=${config.clientId}&scope=${config.scopes}&redirect_uri=${redirectUri}&state=${state}_${workspaceId}`;
    
    res.redirect(authUrl);
  })(req, res);
}
