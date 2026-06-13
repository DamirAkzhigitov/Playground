# Analytics and Cookies

Draft for review. This document defines which analytics tools to use for the
da-mr.com product family, what events to track, and when a cookie consent banner
is required.

Related docs:

- [`product-family.md`](product-family.md) — product strategy and launch order
- [`../packages/auth-core/SSO.md`](../packages/auth-core/SSO.md) — central auth and session cookies

## Goals

Track enough data to answer four questions:

1. Do people understand what each app does?
2. Do they reach the first useful result (activation)?
3. Where do they drop before paying?
4. Which acquisition channel brings users who actually convert?

Do not over-instrument on day one. Start with a small event set and one product
analytics layer.

## Recommended Stack

Use three layers instead of one all-in-one tool.

| Layer | Tool | Purpose | Cookie impact |
| --- | --- | --- | --- |
| Web traffic | [Plausible](https://plausible.io) or [Cloudflare Web Analytics](https://www.cloudflare.com/web-analytics/) | Visits, referrers, top pages | Usually no consent banner |
| Product analytics | [PostHog](https://posthog.com) (EU region) or Plausible custom events at first | Funnels, activation, paywall, retention | Consent may be required in EU if tracking cookies are used |
| Reliability | [Sentry](https://sentry.io) | Frontend and Worker errors | Usually treated as essential / operational, but disclose in Privacy Policy |
| Billing | Stripe / Lemon Squeezy / Paddle dashboard | Checkout, MRR, churn | Billing provider handles payment data; app stores only subscription state |

### Recommended starting setup

For the first public launch:

- **Plausible** for page views and referrers
- **Sentry** for errors
- **Server-side events** in Workers for critical business actions
- **No GA4** and **no ad pixels** until consent flow is ready

Add PostHog later if Plausible custom events are not enough for funnels and
retention analysis.

## Cookie and Consent Rules

### Usually no consent required

These are typically treated as strictly necessary:

- Auth/session cookies on `.da-mr.com` for sign-in
- Security cookies (CSRF, abuse protection)
- Load balancing / infrastructure cookies without cross-site tracking

The central auth app already uses shared session cookies. These should be
described in the Privacy Policy, but they do not usually require a marketing-style
cookie banner.

### Usually consent required (EU / UK)

Ask for consent before enabling:

- Google Analytics 4
- Google Ads conversion tags
- Reddit / Meta / other ad pixels
- Session replay tools (Hotjar, FullStory)
- Product analytics that set non-essential tracking cookies (PostHog, Mixpanel,
  Amplitude) when configured with persistent client identifiers

### Usually no banner, but still disclose

These are privacy-friendly and often do not need a consent banner:

- Plausible in cookieless mode
- Cloudflare Web Analytics
- Server-side analytics without client tracking cookies

Even without a banner, still publish a Privacy Policy and explain what is
collected.

## Do You Need a Cookie Banner?

Short answer:

- **No**, if you use Plausible or Cloudflare Web Analytics plus auth cookies only
- **Yes**, if you add GA4, ad pixels, or cookie-based product analytics for EU
  users
- **Yes before paid ads**, if those ads use conversion tracking pixels

Practical rule:

> If the script sets a non-essential cookie or tracks users across sessions for
> analytics or ads, show consent first for EU/UK visitors.

## Minimum Legal / Trust Pages

Before subscription launch, prepare:

1. **Privacy Policy** — what data is collected, why, retention, third parties
2. **Terms of Service** — account rules, billing, acceptable use
3. **Cookie notice** — only if non-essential cookies are enabled
4. Optional: **Manage cookies** page with accept / reject / essential-only

`apps/resume` (About page) can link to these documents once they exist.

## Event Model

Use the same event names across products where possible.

### Shared events

| Event | When to fire | Key properties |
| --- | --- | --- |
| `landing_viewed` | Public landing or home page load | `product`, `path`, `referrer` |
| `signup_started` | User clicks sign up / register | `product`, `source` |
| `signup_completed` | Account created successfully | `product`, `method` |
| `activation_completed` | User reaches first useful result | `product`, `activation` |
| `paywall_viewed` | Paid feature boundary shown | `product`, `feature`, `plan` |
| `checkout_started` | Billing checkout opened | `product`, `plan` |
| `subscription_started` | Paid subscription confirmed | `product`, `plan`, `provider` |
| `subscription_canceled` | Subscription canceled | `product`, `plan`, `reason` |
| `export_completed` | Export finished successfully | `product`, `format` |
| `retained_week_1` | User returns after 7 days | `product` |

### Product-specific activation events

| Product | Activation event | Meaning |
| --- | --- | --- |
| Compare | `compare.first_comparison_saved` | User saved or created the first comparison |
| Steps | `steps.first_step_completed` | User completed the first step in a guide |

## Funnels To Measure First

### Compare

```text
landing_viewed
  -> signup_completed
  -> compare.first_comparison_saved
  -> paywall_viewed
  -> checkout_started
  -> subscription_started
```

Primary questions:

- Which category pages convert best?
- Do users save a comparison before hitting the paywall?
- Is export or premium category access the stronger paid trigger?

### Steps

```text
landing_viewed
  -> signup_completed
  -> steps.first_step_completed
  -> paywall_viewed
  -> checkout_started
  -> subscription_started
```

Primary questions:

- Which guide topics attract search traffic?
- Do users return after completing one step?
- Is saved progress or premium guides the stronger paid trigger?

## Where To Instrument in This Repo

| Surface | What to track first |
| --- | --- |
| `apps/main` | Page views, outbound clicks to Compare / Steps / About |
| `apps/auth` | `signup_started`, `signup_completed`, login success/failure |
| `apps/compare` | Category view, comparison created/saved, paywall, export |
| `apps/steps` | Guide opened, step completed, paywall, export |
| Workers | Subscription status changes, export requests, entitlement denials |

Prefer server-side logging for billing and entitlement events. Client analytics
can miss ad blockers and failed requests.

## Suggested Rollout

### Phase 1 — Before paid launch

- Add Plausible to `main`, `compare`, `steps`, and `auth`
- Add Sentry to frontend apps and Workers
- Track shared events manually or via a tiny analytics helper
- Publish Privacy Policy

### Phase 2 — Before ads

- Add cookie consent banner for EU/UK
- Enable ad conversion tags only after consent
- Add PostHog if funnel analysis becomes necessary

### Phase 3 — After first paying users

- Review activation and paywall conversion every 2 weeks
- Add retention and channel breakdown
- Decide whether to keep Plausible only or move more events into PostHog

## Open Decisions For Review

Please review and decide:

1. **Primary analytics tool**
   - Option A: Plausible only at first (simplest, lowest consent friction)
   - Option B: Plausible + PostHog from the start (more product insight, more setup)

2. **Target regions**
   - EU/UK only → consent matters more
   - Global including EU → consent banner likely needed once ad/analytics cookies are added

3. **First paid trigger to measure**
   - Compare: export vs premium categories vs saved comparison history
   - Steps: saved progress vs premium guides

4. **Billing provider**
   - Stripe, Lemon Squeezy, or Paddle (affects checkout events and tax handling)

## Recommendation

Start with:

- Plausible
- Sentry
- Shared event names from this document
- Privacy Policy
- No cookie banner initially, if no ad/analytics tracking cookies are used

Add a cookie banner only when enabling GA4, ad pixels, or cookie-based product
analytics for EU users.
