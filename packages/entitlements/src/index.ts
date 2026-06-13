export type ProductId = 'compare' | 'steps'

export type PlanId = 'free' | 'pro' | 'founder'

export type EntitlementKey =
  | 'compare:comparisons:create'
  | 'compare:comparisons:unlimited'
  | 'compare:categories:premium'
  | 'compare:filters:advanced'
  | 'compare:export'
  | 'steps:guides:start'
  | 'steps:progress:save'
  | 'steps:notes:private'
  | 'steps:export'
  | 'steps:premium-guides'

export type ProductDefinition = {
  id: ProductId
  name: string
  role: 'core' | 'lead-magnet'
  publicOrigin: string
  activationEvent: string
  paidTriggers: EntitlementKey[]
}

export type PlanDefinition = {
  id: PlanId
  name: string
  description: string
  entitlements: EntitlementKey[]
}

export type SubscriptionState = {
  plan: PlanId
  status: 'free' | 'trialing' | 'active' | 'past_due' | 'canceled'
}

export const PRODUCTS = {
  compare: {
    id: 'compare',
    name: 'Compare',
    role: 'core',
    publicOrigin: 'https://compare.da-mr.com',
    activationEvent: 'compare.first_comparison_saved',
    paidTriggers: [
      'compare:comparisons:unlimited',
      'compare:categories:premium',
      'compare:filters:advanced',
      'compare:export'
    ]
  },
  steps: {
    id: 'steps',
    name: 'Steps',
    role: 'lead-magnet',
    publicOrigin: 'https://steps.da-mr.com',
    activationEvent: 'steps.first_step_completed',
    paidTriggers: [
      'steps:progress:save',
      'steps:notes:private',
      'steps:export',
      'steps:premium-guides'
    ]
  }
} as const satisfies Record<ProductId, ProductDefinition>

export const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    description: 'Public pages and enough saved work to understand the value.',
    entitlements: ['compare:comparisons:create', 'steps:guides:start']
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    description:
      'Shared subscription for solo professionals using the tools regularly.',
    entitlements: [
      'compare:comparisons:create',
      'compare:comparisons:unlimited',
      'compare:categories:premium',
      'compare:filters:advanced',
      'compare:export',
      'steps:guides:start',
      'steps:progress:save',
      'steps:notes:private',
      'steps:export',
      'steps:premium-guides'
    ]
  },
  founder: {
    id: 'founder',
    name: 'Founder',
    description: 'Early supporter access to Pro features and future products.',
    entitlements: [
      'compare:comparisons:create',
      'compare:comparisons:unlimited',
      'compare:categories:premium',
      'compare:filters:advanced',
      'compare:export',
      'steps:guides:start',
      'steps:progress:save',
      'steps:notes:private',
      'steps:export',
      'steps:premium-guides'
    ]
  }
} as const satisfies Record<PlanId, PlanDefinition>

export function getPlanEntitlements(plan: PlanId): ReadonlySet<EntitlementKey> {
  return new Set(PLANS[plan].entitlements)
}

function planHasEntitlement(plan: PlanDefinition, entitlement: EntitlementKey) {
  return (plan.entitlements as readonly EntitlementKey[]).includes(entitlement)
}

export function hasEntitlement(
  subscription: SubscriptionState | null | undefined,
  entitlement: EntitlementKey
): boolean {
  const plan = subscription?.plan ?? 'free'
  const status = subscription?.status ?? 'free'

  if (status === 'past_due' || status === 'canceled') {
    return planHasEntitlement(PLANS.free, entitlement)
  }

  return planHasEntitlement(PLANS[plan], entitlement)
}
