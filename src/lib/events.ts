import { getServiceSupabase } from './supabase';

type EventType = 
  | 'passport_created'
  | 'passport_viewed'
  | 'passport_updated'
  | 'qr_downloaded'
  | 'pdf_downloaded'
  | 'json_exported'
  | 'shopify_imported'
  | 'shopify_metafield_synced'
  | 'ai_suggestion_generated';

export async function trackEvent(
  eventType: EventType,
  passportId?: string,
  workspaceId?: string | null,
  userId?: string | null,
  metadata: any = {}
) {
  try {
    const supabase = getServiceSupabase();
    await supabase.from('passport_events').insert({
      event_type: eventType,
      passport_id: passportId,
      workspace_id: workspaceId,
      user_id: userId,
      metadata
    });
  } catch (err) {
    console.error('Failed to track event', err);
  }
}
