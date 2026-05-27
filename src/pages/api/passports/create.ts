import type { NextApiRequest, NextApiResponse } from 'next';
import { nanoid } from 'nanoid';
import { supabase, getPublicPassportUrl, getEditUrl, isSupabaseConfigured, getServiceSupabase } from '@/lib/supabase';
import { getAuthUser } from '@/lib/server-auth';
import { getPlanLimits, canCreatePassport } from '@/lib/billing';
import { trackEvent } from '@/lib/events';
import { passportCreateSchema } from '@/lib/schema';
import { calculateDataQuality } from '@/lib/scoring';
import { detectCategoryModule } from '@/lib/categories';
import type { PassportRecord } from '@/lib/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!isSupabaseConfigured()) {
    return res.status(500).json({
      error: 'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local',
    });
  }

  try {
    const parsed = passportCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    }

    const data = parsed.data;
    const slug = `${data.brand_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 20)}-${nanoid(8)}`;
    const edit_token = nanoid(32);

    // Auto-detect category module
    const module = detectCategoryModule(data.category, data.product_type);

    // Build full record for scoring
    const fullRecord = {
      ...data,
      slug,
      edit_token,
      product_category_module: module,
      data_quality_score: 0,
      readiness_level: 'needs_review',
    } as PassportRecord;

    const quality = calculateDataQuality(fullRecord);

    // Auth check
    let user = await getAuthUser(req);
    let workspaceId = req.body.workspace_id || null;
    let plan = 'free';
    let watermark = true;
    
    const adminClient = getServiceSupabase();

    if (user && workspaceId) {
      // Validate workspace access
      const { data: member } = await adminClient
        .from('workspace_members')
        .select('role, workspaces(plan)')
        .eq('workspace_id', workspaceId)
        .eq('user_id', user.id)
        .single();
        
      if (member) {
        plan = (member.workspaces as any).plan || 'free';
        const limits = getPlanLimits(plan);
        watermark = limits.watermark;
        
        // Enforce limits
        const { count } = await adminClient
          .from('passports')
          .select('*', { count: 'exact', head: true })
          .eq('workspace_id', workspaceId);
          
        if (count !== null && !canCreatePassport(plan, count)) {
          return res.status(403).json({ error: 'Plan limit reached. Upgrade to create more passports.' });
        }
      } else {
        user = null;
        workspaceId = null;
      }
    } else {
      user = null;
      workspaceId = null;
    }

    const insertData = {
      ...data,
      slug,
      edit_token,
      product_category_module: module,
      data_quality_score: quality.score,
      readiness_level: quality.level,
      status: 'published',
      last_updated: data.last_updated || new Date().toISOString().split('T')[0],
      user_id: user?.id || null,
      workspace_id: workspaceId || null,
      plan_snapshot: plan,
      watermark,
    };

    const { data: row, error } = await adminClient
      .from('passports')
      .insert(insertData)
      .select('id, slug')
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(500).json({ error: 'Failed to save passport', details: error.message });
    }

    // Track event
    await trackEvent('passport_created', row.id, workspaceId, user?.id);

    return res.status(201).json({
      id: row.id,
      slug: row.slug,
      publicUrl: getPublicPassportUrl(row.slug),
      editUrl: getEditUrl(row.slug, edit_token),
      edit_token,
    });
  } catch (err: unknown) {
    console.error('Create passport error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
