export interface PlanLimits {
  max_passports: number;
  watermark: boolean;
  team: boolean;
  shopify: boolean;
  ai: boolean;
}

export function getPlanLimits(plan: string): PlanLimits {
  switch (plan.toLowerCase()) {
    case 'pro':
      return {
        max_passports: 200,
        watermark: false,
        team: true,
        shopify: true,
        ai: true,
      };
    case 'brand':
      return {
        max_passports: 50,
        watermark: false,
        team: true,
        shopify: true,
        ai: false,
      };
    case 'starter':
      return {
        max_passports: 10,
        watermark: false,
        team: false,
        shopify: false,
        ai: false,
      };
    default: // free
      return {
        max_passports: 1,
        watermark: true,
        team: false,
        shopify: false,
        ai: false,
      };
  }
}

export function canCreatePassport(plan: string, currentCount: number): boolean {
  const limits = getPlanLimits(plan);
  return currentCount < limits.max_passports;
}

export function mapStripePriceToPlan(priceId: string): string {
  if (priceId === process.env.STRIPE_PRICE_PRO) return 'pro';
  if (priceId === process.env.STRIPE_PRICE_BRAND) return 'brand';
  if (priceId === process.env.STRIPE_PRICE_STARTER) return 'starter';
  return 'free';
}
