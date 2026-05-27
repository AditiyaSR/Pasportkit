import { NextApiRequest, NextApiResponse } from 'next';
import { trackEvent } from '@/lib/events';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  
  try {
    const { eventType, passportId, workspaceId, userId, metadata } = req.body;
    if (!eventType) return res.status(400).json({ error: 'Missing eventType' });

    // Track event server-side to avoid exposing service key to client
    await trackEvent(eventType, passportId, workspaceId, userId, metadata);

    res.status(200).json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
