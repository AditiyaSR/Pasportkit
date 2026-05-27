import Stripe from 'stripe';
import { getSiteUrl } from './supabase';

export function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    return null;
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2026-05-27.dahlia',
  });
}

export async function createCheckoutSession(
  priceId: string,
  workspaceId: string,
  customerId?: string
) {
  const stripe = getStripe();
  if (!stripe) throw new Error('Stripe is not configured');

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer: customerId || undefined,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    metadata: {
      workspaceId,
    },
    success_url: `${getSiteUrl()}/dashboard/billing?success=true`,
    cancel_url: `${getSiteUrl()}/dashboard/billing?canceled=true`,
  });

  return session.url;
}

export async function createPortalSession(customerId: string) {
  const stripe = getStripe();
  if (!stripe) throw new Error('Stripe is not configured');

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${getSiteUrl()}/dashboard/billing`,
  });

  return session.url;
}
