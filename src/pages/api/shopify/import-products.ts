import { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '@/lib/server-auth';
import { getServiceSupabase } from '@/lib/supabase';
import { hasWorkspacePermission } from '@/lib/permissions';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  
  await requireAuth(async (req, res, user) => {
    try {
      const { workspaceId, shopDomain } = req.body;
      if (!workspaceId || !shopDomain) return res.status(400).json({ error: 'Missing fields' });

      const adminClient = getServiceSupabase();
      const { data: member } = await adminClient.from('workspace_members').select('role').eq('workspace_id', workspaceId).eq('user_id', user.id).single();
      if (!member || !hasWorkspacePermission(member.role, 'manage_integrations')) return res.status(403).json({ error: 'Forbidden' });

      const { data: conn } = await adminClient.from('shopify_connections').select('access_token').eq('workspace_id', workspaceId).eq('shop_domain', shopDomain).single();
      if (!conn || !conn.access_token) return res.status(400).json({ error: 'Shopify not connected' });

      const shopifyRes = await fetch(`https://${shopDomain}/admin/api/2024-01/products.json?limit=50`, {
        headers: { 'X-Shopify-Access-Token': conn.access_token }
      });
      if (!shopifyRes.ok) throw new Error('Failed to fetch products from Shopify');
      
      const { products } = await shopifyRes.json();

      const inserts = products.map((p: any) => ({
        workspace_id: workspaceId,
        shop_domain: shopDomain,
        shopify_product_id: String(p.id),
        title: p.title,
        handle: p.handle,
        product_type: p.product_type,
        vendor: p.vendor,
        image_url: p.image?.src || null,
        raw: p
      }));

      // Delete old imports for this shop to refresh
      await adminClient.from('shopify_imports').delete().eq('workspace_id', workspaceId).eq('shop_domain', shopDomain);
      
      if (inserts.length > 0) {
        await adminClient.from('shopify_imports').insert(inserts);
      }

      res.status(200).json({ imported: inserts.length });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  })(req, res);
}
