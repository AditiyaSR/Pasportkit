import { NextApiRequest, NextApiResponse } from 'next';
import { buffer } from 'micro';
import Stripe from 'stripe';
import { getServiceSupabase } from '@/lib/supabase';
import { getStripe } from '@/lib/stripe';
import { mapStripePriceToPlan } from '@/lib/billing';
import { sendBillingIssueEmail } from '@/lib/email';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  
  const stripe = getStripe();
  if (!stripe) return res.status(500).send('Stripe not configured');

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'] as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf.toString(), sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const adminClient = getServiceSupabase();

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const workspaceId = session.metadata?.workspaceId;
      if (workspaceId) {
        await adminClient.from('workspaces').update({
          stripe_customer_id: session.customer as string,
        }).eq('id', workspaceId);
      }
    }

    if (
      event.type === 'customer.subscription.created' ||
      event.type === 'customer.subscription.updated' ||
      event.type === 'customer.subscription.deleted'
    ) {
      const subscription = event.data.object as any;
      const customerId = subscription.customer as string;
      const priceId = subscription.items.data[0].price.id;
      const plan = mapStripePriceToPlan(priceId);

      const { data: workspace } = await adminClient
        .from('workspaces')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single();

      if (workspace) {
        await adminClient.from('subscriptions').upsert({
          workspace_id: workspace.id,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscription.id,
          stripe_price_id: priceId,
          plan,
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
        }, { onConflict: 'stripe_subscription_id' });

        const activePlan = subscription.status === 'active' || subscription.status === 'trialing' ? plan : 'free';
        
        await adminClient.from('workspaces').update({
          plan: activePlan,
          stripe_subscription_id: subscription.id,
          subscription_status: subscription.status,
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        }).eq('id', workspace.id);
      }
    }

    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;
      const { data: rawWorkspace } = await adminClient.from('workspaces').select('id, name, owner_id, profiles!owner_id(email)').eq('stripe_customer_id', customerId).single();
      const workspace = rawWorkspace as any;
      if (workspace && workspace.profiles?.email) {
        await sendBillingIssueEmail(workspace.profiles.email, workspace.name, workspace.id);
      } else if (workspace && workspace.profiles?.[0]?.email) {
        await sendBillingIssueEmail(workspace.profiles[0].email, workspace.name, workspace.id);
      }
    }

    if (event.type.startsWith('customer.subscription') || event.type.startsWith('invoice')) {
      const obj = event.data.object as any;
      const customerId = obj.customer as string;
      if (customerId) {
        const { data: workspace } = await adminClient.from('workspaces').select('id').eq('stripe_customer_id', customerId).single();
        if (workspace) {
          await adminClient.from('billing_events').insert({
            workspace_id: workspace.id,
            stripe_event_id: event.id,
            event_type: event.type,
            data: event.data.object
          });
        }
      }
    }

    res.status(200).json({ received: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to process webhook' });
  }
}
