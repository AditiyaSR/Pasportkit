import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase, getPublicPassportUrl, isSupabaseConfigured } from '@/lib/supabase';
import { passportCreateSchema } from '@/lib/schema';
import { calculateDataQuality } from '@/lib/scoring';
import { detectCategoryModule } from '@/lib/categories';
import type { PassportRecord } from '@/lib/types';
import { trackEvent } from '@/lib/events';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!isSupabaseConfigured()) {
    return res.status(500).json({ error: 'Supabase is not configured.' });
  }

  const { slug, edit_token, ...body } = req.body;

  if (!slug || !edit_token) {
    return res.status(400).json({ error: 'Missing slug or edit_token' });
  }

  // Verify edit_token
  const { data: existing, error: fetchErr } = await supabase
    .from('passports')
    .select('id, edit_token, workspace_id, user_id')
    .eq('slug', slug)
    .single();

  if (fetchErr || !existing) {
    return res.status(404).json({ error: 'Passport not found' });
  }

  if (existing.edit_token !== edit_token) {
    return res.status(403).json({ error: 'Invalid edit token' });
  }

  try {
    const parsed = passportCreateSchema.safeParse(body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    }

    const data = parsed.data;
    const module = detectCategoryModule(data.category, data.product_type);

    const fullRecord = { ...data, slug, edit_token, product_category_module: module, data_quality_score: 0, readiness_level: 'needs_review' } as PassportRecord;
    const quality = calculateDataQuality(fullRecord);

    const updateData = {
      ...data,
      product_category_module: module,
      data_quality_score: quality.score,
      readiness_level: quality.level,
      updated_at: new Date().toISOString(),
      last_updated: data.last_updated || new Date().toISOString().split('T')[0],
    };

    const { error: updateErr } = await supabase
      .from('passports')
      .update(updateData)
      .eq('slug', slug)
      .eq('edit_token', edit_token);

    if (updateErr) {
      console.error('Update error:', updateErr);
      return res.status(500).json({ error: 'Failed to update passport' });
    }

    await trackEvent('passport_updated', existing.id, existing.workspace_id, existing.user_id);

    return res.status(200).json({
      slug,
      publicUrl: getPublicPassportUrl(slug),
    });
  } catch (err) {
    console.error('Update passport error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
