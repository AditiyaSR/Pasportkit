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

    if (user) {
      // 1. Ensure profile exists and check super admin
      let { data: profile } = await adminClient
        .from('profiles')
        .select('is_super_admin')
        .eq('id', user.id)
        .single();
        
      if (!profile) {
        // Create fallback profile
        await adminClient.from('profiles').upsert({
          id: user.id,
          email: user.email,
          full_name: user.email?.split('@')[0] || 'User',
        });
        profile = { is_super_admin: false };
      }

      // 2. Find workspace
      let { data: members } = await adminClient
        .from('workspace_members')
        .select('workspace_id, role, workspaces(plan)')
        .eq('user_id', user.id);
        
      let member = members?.length ? members[0] : null;

      if (workspaceId && members) {
        const found = members.find(m => m.workspace_id === workspaceId);
        if (found) member = found;
      }

      // 3. Fallback to create workspace if no memberships exist
      if (!member) {
        const workspaceName = 'My Workspace';
        const slug = `${workspaceName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Math.random().toString(36).substring(7)}`;

        const { data: wsData, error: wsError } = await adminClient.from('workspaces').insert({
          name: workspaceName,
          slug,
          owner_id: user.id,
          plan: 'free',
          subscription_status: 'free'
        }).select().single();
        
        if (wsError) console.error('[Create Passport] Fallback workspace error:', wsError);

        if (wsData) {
          workspaceId = wsData.id;
          await adminClient.from('workspace_members').insert({
            workspace_id: wsData.id,
            user_id: user.id,
            role: 'owner'
          });
          await adminClient.from('email_preferences').insert({ workspace_id: wsData.id });
          plan = 'free';
          member = { workspace_id: wsData.id, role: 'owner', workspaces: { plan: 'free' } } as any;
        } else {
          // If we still can't create one, drop to guest mode
          user = null;
          workspaceId = null;
        }
      } else {
        workspaceId = member.workspace_id;
        plan = (member.workspaces as any)?.plan || 'free';
      }

      // 4. Enforce plan limits if not super admin
      if (user && workspaceId && !profile?.is_super_admin) {
        const limits = getPlanLimits(plan);
        watermark = limits.watermark;
        
        const { count } = await adminClient
          .from('passports')
          .select('*', { count: 'exact', head: true })
          .eq('workspace_id', workspaceId);
          
        if (count !== null && !canCreatePassport(plan, count)) {
          return res.status(403).json({ error: 'Plan limit reached. Upgrade to create more passports.' });
        }
      } else if (user && workspaceId && profile?.is_super_admin) {
        watermark = false; // Super admin gets no watermark
      }
    } else {
      user = null;
      workspaceId = null;
    }
    
    // Debug logging
    console.log(`[Create Passport] Auth: ${!!user}, User: ${user?.id || 'none'}, WS: ${workspaceId || 'none'}, Slug: ${slug}`);

    const insertData = {
      ...data,
      slug,
      edit_token,
      product_category_module: module,
      data_quality_score: quality.score,
      readiness_level: quality.level,
      status: 'published',
      visibility: 'public',
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
