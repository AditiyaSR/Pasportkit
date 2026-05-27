import { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '@/lib/server-auth';
import { getServiceSupabase, getPublicPassportUrl } from '@/lib/supabase';
import { hasWorkspacePermission } from '@/lib/permissions';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  
  await requireAuth(async (req, res, user) => {
    try {
      const { workspaceId, passportId } = req.body;
      if (!workspaceId || !passportId) return res.status(400).json({ error: 'Missing fields' });

      const adminClient = getServiceSupabase();
      const { data: member } = await adminClient.from('workspace_members').select('role').eq('workspace_id', workspaceId).eq('user_id', user.id).single();
      if (!member || !hasWorkspacePermission(member.role, 'manage_integrations')) return res.status(403).json({ error: 'Forbidden' });

      const { data: passport } = await adminClient.from('passports').select('slug, shopify_product_id').eq('id', passportId).eq('workspace_id', workspaceId).single();
      if (!passport || !passport.shopify_product_id) return res.status(400).json({ error: 'Passport not linked to Shopify' });

      const { data: conn } = await adminClient.from('shopify_connections').select('shop_domain, access_token').eq('workspace_id', workspaceId).single();
      if (!conn || !conn.access_token) return res.status(400).json({ error: 'Shopify not connected' });

      const publicUrl = getPublicPassportUrl(passport.slug);

      const shopifyRes = await fetch(`https://${conn.shop_domain}/admin/api/2024-01/products/${passport.shopify_product_id}/metafields.json`, {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': conn.access_token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          metafield: {
            namespace: 'passportkit',
            key: 'passport_url',
            type: 'single_line_text_field',
            value: publicUrl
          }
        })
      });

      if (!shopifyRes.ok) {
        const errData = await shopifyRes.json();
        throw new Error(JSON.stringify(errData));
      }

      await adminClient.from('shopify_sync_logs').insert({
        workspace_id: workspaceId,
        shop_domain: conn.shop_domain,
        shopify_product_id: passport.shopify_product_id,
        passport_id: passportId,
        action: 'sync_metafield',
        status: 'success'
      });

      res.status(200).json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  })(req, res);
}
