import { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '@/lib/server-auth';
import { getServiceSupabase } from '@/lib/supabase';
import { hasWorkspacePermission } from '@/lib/permissions';
import { generatePassportSuggestions } from '@/lib/ai';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  
  await requireAuth(async (req, res, user) => {
    try {
      const { workspaceId, productData } = req.body;
      if (!workspaceId || !productData) return res.status(400).json({ error: 'Missing fields' });

      const adminClient = getServiceSupabase();
      
      const { data: member } = await adminClient.from('workspace_members').select('role, workspaces(plan)').eq('workspace_id', workspaceId).eq('user_id', user.id).single();
      if (!member) return res.status(403).json({ error: 'Forbidden' });
      
      // Allow if admin and plan is pro
      if (!hasWorkspacePermission(member.role, 'use_ai')) {
        return res.status(403).json({ error: 'Permission denied for AI usage' });
      }

      const plan = (member.workspaces as any).plan;
      if (plan !== 'pro' && process.env.NODE_ENV !== 'development') {
        return res.status(403).json({ error: 'AI features require Pro plan' });
      }

      const suggestions = await generatePassportSuggestions(productData, workspaceId, user.id);

      res.status(200).json(suggestions);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  })(req, res);
}
