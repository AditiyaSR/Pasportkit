import { NextApiRequest, NextApiResponse } from 'next';
import { getShopifyConfig, verifyShopifyHmac } from '@/lib/shopify';
import { getServiceSupabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  
  const { code, shop, state } = req.query;
  
  if (!code || !shop || !state || typeof code !== 'string' || typeof shop !== 'string' || typeof state !== 'string') {
    return res.status(400).send('Missing params');
  }

  if (!verifyShopifyHmac(req.query)) {
    return res.status(400).send('HMAC validation failed');
  }

  const parts = state.split('_');
  if (parts.length !== 2) return res.status(400).send('Invalid state');
  const [nonce, workspaceId] = parts;

  // Simple state verification via cookie could go here
  // const expectedState = req.cookies[`shopify_state_${workspaceId}`];
  // if (expectedState !== nonce) return res.status(400).send('State mismatch');

  const config = getShopifyConfig();

  try {
    const accessTokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code
      })
    });

    const data = await accessTokenResponse.json();
    if (!data.access_token) throw new Error('No access token received');

    const adminClient = getServiceSupabase();
    await adminClient.from('shopify_connections').upsert({
      workspace_id: workspaceId,
      shop_domain: shop,
      access_token: data.access_token,
      scope: data.scope,
      status: 'connected'
    }, { onConflict: 'workspace_id,shop_domain' });

    res.redirect(`/dashboard/integrations/shopify?connected=true&shop=${shop}`);
  } catch (err: any) {
    res.status(500).send(`Failed to get access token: ${err.message}`);
  }
}
