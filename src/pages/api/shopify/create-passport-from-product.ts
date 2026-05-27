import { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '@/lib/server-auth';
import { getServiceSupabase } from '@/lib/supabase';
import { hasWorkspacePermission } from '@/lib/permissions';
import { EMPTY_PASSPORT } from '@/lib/types';
import { nanoid } from 'nanoid';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  
  await requireAuth(async (req, res, user) => {
    try {
      const { workspaceId, importId } = req.body;
      if (!workspaceId || !importId) return res.status(400).json({ error: 'Missing fields' });

      const adminClient = getServiceSupabase();
      const { data: member } = await adminClient.from('workspace_members').select('role, workspaces(name)').eq('workspace_id', workspaceId).eq('user_id', user.id).single();
      if (!member || !hasWorkspacePermission(member.role, 'create_passport')) return res.status(403).json({ error: 'Forbidden' });

      const { data: imp } = await adminClient.from('shopify_imports').select('*').eq('id', importId).eq('workspace_id', workspaceId).single();
      if (!imp) return res.status(404).json({ error: 'Import not found' });

      const slug = `${imp.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${nanoid(8)}`;
      const editToken = nanoid(32);

      const passportData = {
        ...EMPTY_PASSPORT,
        slug,
        edit_token: editToken,
        user_id: user.id,
        workspace_id: workspaceId,
        brand_name: imp.vendor || (member.workspaces as any).name || '',
        product_name: imp.title,
        category: imp.product_type,
        product_type: imp.product_type,
        product_page_url: `https://${imp.shop_domain}/products/${imp.handle}`,
        product_image_url: imp.image_url || '',
        source: 'shopify',
        shopify_product_id: imp.shopify_product_id,
        status: 'draft',
      };

      const { data: passport, error } = await adminClient.from('passports').insert(passportData).select().single();
      if (error) throw error;

      await adminClient.from('shopify_imports').update({ passport_id: passport.id }).eq('id', imp.id);

      res.status(200).json({ slug: passport.slug, id: passport.id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  })(req, res);
}
