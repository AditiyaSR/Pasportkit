import type { NextApiRequest, NextApiResponse } from 'next';
import type { User } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';
import { supabase, getPublicPassportUrl, getEditUrl, isSupabaseConfigured, getServiceSupabase } from '@/lib/supabase';
import { getAuthUser } from '@/lib/server-auth';
import { getPlanLimits } from '@/lib/billing';
import { hasWorkspacePermission } from '@/lib/permissions';
import { trackEvent } from '@/lib/events';
import { passportCreateSchema } from '@/lib/schema';
import { calculateDataQuality } from '@/lib/scoring';
import { detectCategoryModule } from '@/lib/categories';
import type { PassportRecord } from '@/lib/types';

type WorkspaceMemberWithPlan = {
  workspace_id: string;
  role: string;
  workspaces?: { plan?: string | null } | { plan?: string | null }[] | null;
};

function workspacePlan(member: WorkspaceMemberWithPlan | null): string {
  const workspace = Array.isArray(member?.workspaces) ? member?.workspaces[0] : member?.workspaces;
  return workspace?.plan || 'free';
}

function logCreate(message: string, details?: Record<string, unknown>) {
  console.log('[Create Passport]', message, details || '');
}

function publicInsertError(message: string) {
  if (/invalid api key/i.test(message)) {
    return 'Supabase server API key is invalid or expired. Check SUPABASE_SERVICE_ROLE_KEY.';
  }
  return `Failed to save passport: ${message}`;
}

async function ensureWorkspaceForUser(
  adminClient: ReturnType<typeof getServiceSupabase>,
  user: User,
  requestedWorkspaceId?: string | null
) {
  let { data: profile } = await adminClient
    .from('profiles')
    .select('is_super_admin')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) {
    const { error: profileError } = await adminClient.from('profiles').upsert({
      id: user.id,
      email: user.email,
      full_name: user.email?.split('@')[0] || 'User',
      is_super_admin: false,
    });

    if (profileError) {
      throw new Error(`Failed to ensure profile: ${profileError.message}`);
    }

    profile = { is_super_admin: false };
  }

  const { data: members, error: memberError } = await adminClient
    .from('workspace_members')
    .select('workspace_id, role, workspaces(plan)')
    .eq('user_id', user.id);

  if (memberError) {
    throw new Error(`Failed to load workspace membership: ${memberError.message}`);
  }

  const typedMembers = (members || []) as WorkspaceMemberWithPlan[];
  let member =
    requestedWorkspaceId
      ? typedMembers.find((item) => item.workspace_id === requestedWorkspaceId) || null
      : typedMembers[0] || null;

  if (!member) {
    const workspaceName = 'My Workspace';
    const workspaceSlug = `${workspaceName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${nanoid(8)}`;
    const { data: workspace, error: workspaceError } = await adminClient
      .from('workspaces')
      .insert({
        name: workspaceName,
        slug: workspaceSlug,
        owner_id: user.id,
        plan: 'free',
        subscription_status: 'free',
      })
      .select('id, plan')
      .single();

    if (workspaceError || !workspace) {
      throw new Error(`Failed to create default workspace: ${workspaceError?.message || 'missing workspace row'}`);
    }

    const { error: upsertMemberError } = await adminClient
      .from('workspace_members')
      .upsert({
        workspace_id: workspace.id,
        user_id: user.id,
        role: 'owner',
      }, { onConflict: 'workspace_id,user_id' });

    if (upsertMemberError) {
      throw new Error(`Failed to create workspace membership: ${upsertMemberError.message}`);
    }

    await adminClient.from('email_preferences').insert({ workspace_id: workspace.id });
    member = { workspace_id: workspace.id, role: 'owner', workspaces: { plan: workspace.plan || 'free' } };
  }

  return {
    profile,
    member,
    workspaceId: member.workspace_id,
    role: member.role,
    plan: workspacePlan(member),
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!isSupabaseConfigured()) {
    return res.status(500).json({
      error: 'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local',
    });
  }

  const authHeader = req.headers.authorization;
  const authTokenPresent = typeof authHeader === 'string' && authHeader.startsWith('Bearer ');
  logCreate('API called', { authTokenPresent });

  try {
    const parsed = passportCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    }

    const data = parsed.data;
    const slug = `${data.brand_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 20)}-${nanoid(8)}`;
    const edit_token = nanoid(32);
    const module = detectCategoryModule(data.category, data.product_type);
    const adminClient = authTokenPresent ? getServiceSupabase() : null;

    const fullRecord = {
      ...data,
      slug,
      edit_token,
      product_category_module: module,
      data_quality_score: 0,
      readiness_level: 'needs_review',
    } as PassportRecord;
    const quality = calculateDataQuality(fullRecord);

    let user = authTokenPresent ? await getAuthUser(req) : null;
    let workspaceId: string | null = null;
    let plan = 'free';
    let watermark = true;
    let isSuperAdmin = false;

    if (authTokenPresent && !user) {
      logCreate('Auth resolved', { userFound: false });
      return res.status(401).json({
        error: 'Authentication could not be verified. Sign in again or check SUPABASE_SERVICE_ROLE_KEY.',
      });
    }

    if (user && adminClient) {
      logCreate('Auth resolved', { userFound: true, userId: user.id });
      const requestedWorkspaceId = typeof req.body.workspace_id === 'string' ? req.body.workspace_id : null;
      const workspaceContext = await ensureWorkspaceForUser(adminClient, user, requestedWorkspaceId);
      workspaceId = workspaceContext.workspaceId;
      plan = workspaceContext.plan;
      isSuperAdmin = !!workspaceContext.profile?.is_super_admin;

      if (!isSuperAdmin && !hasWorkspacePermission(workspaceContext.role, 'create_passport')) {
        return res.status(403).json({ error: 'You do not have permission to create passports in this workspace.' });
      }

      const limits = getPlanLimits(plan);
      watermark = isSuperAdmin ? false : limits.watermark;

      const { count, error: countError } = await adminClient
        .from('passports')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId);

      if (countError) {
        throw new Error(`Failed to count workspace passports: ${countError.message}`);
      }

      const currentCount = count ?? 0;
      logCreate('Workspace resolved', {
        userId: user.id,
        workspaceFound: true,
        workspaceId,
        plan,
        currentCount,
        maxCount: limits.max_passports,
        isSuperAdmin,
      });

      if (!isSuperAdmin && currentCount >= limits.max_passports) {
        return res.status(403).json({ error: 'Plan limit reached. Upgrade to create more passports.' });
      }
    } else {
      logCreate('Auth resolved', { userFound: false });
      logCreate('No valid user found; creating guest passport', {
        authTokenPresent,
        workspaceFound: false,
        plan,
        currentCount: 0,
        maxPassports: 'guest',
      });
    }

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
      workspace_id: workspaceId,
      plan_snapshot: plan,
      watermark,
    };

    logCreate('Insert payload ready', {
      status: insertData.status,
      visibility: insertData.visibility,
      userId: insertData.user_id || 'guest',
      workspaceId: insertData.workspace_id || 'guest',
    });

    const insertClient = adminClient || supabase;
    const { data: row, error } = await insertClient
      .from('passports')
      .insert(insertData)
      .select('id, slug, status, visibility')
      .single();

    if (error) {
      console.error('[Create Passport] Insert failure:', error);
      logCreate('Insert result', { success: false, error: error.message });
      return res.status(500).json({ error: publicInsertError(error.message), details: error.message });
    }

    logCreate('Insert success', {
      success: true,
      slug: row.slug,
      status: row.status,
      visibility: row.visibility,
      workspaceId: workspaceId || 'guest',
    });

    await trackEvent('passport_created', row.id, workspaceId, user?.id);

    return res.status(201).json({
      id: row.id,
      slug: row.slug,
      status: row.status,
      visibility: row.visibility,
      publicUrl: getPublicPassportUrl(row.slug),
      editUrl: getEditUrl(row.slug, edit_token),
    });
  } catch (err: unknown) {
    console.error('Create passport error:', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Internal server error' });
  }
}
