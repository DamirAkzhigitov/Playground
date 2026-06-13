# Execution Roadmap

Draft for review. Priorities and task order from a company-owner perspective:
what to build, in what sequence, and what to deliberately postpone.

Related docs:

- [`product-family.md`](product-family.md) — product strategy and MVP scoring
- [`analytics-and-cookies.md`](analytics-and-cookies.md) — analytics and consent

## North Star

Over the next 8–12 weeks, the goal is not to grow the whole product line at
once. The goal is to bring **one product to first revenue**.

Focus:

- `Compare` — core paid product
- `Steps` — traffic and lead magnet
- `Main` — app directory
- `Auth` — shared platform
- `Resume` — static About page

## Phase 0 — Lock Strategy (3–5 days)

1. Confirm positioning:
   - `Compare` = universal comparison of products, services, and categories
   - `Steps` = guide for completing complex paths and processes
   - `Resume` = About page
   - `Main` = app catalog
2. Choose **one core monetization product**: `Compare`
3. Choose **one lead magnet**: `Steps`
4. Decide the first paid boundary for `Compare`:
   - export
   - premium categories
   - saved comparison history
   - advanced filters
5. Set v1 pricing, for example `$9–19/month` or `$49/year`

**Outcome:** the team stops debating what to build every week.

## Phase 1 — Platform and Trust (1–2 weeks)

### Development

1. Stabilize central auth across `auth`, `compare`, and `steps`
2. Remove duplicate login/register flows from product apps if any remain
3. Ensure one account flow: login -> return to product
4. Prepare baseline trust pages:
   - Privacy Policy
   - Terms of Service
   - About
5. Update `Main` as a clean product catalog, not an experiment page

### Product

6. Define what in `Compare` is public vs account-only
7. Define what in `Steps` is a public guide vs saved progress behind login

**Outcome:** users can enter the ecosystem, sign up, and return to a product
without friction.

## Phase 2 — Compare to Sellable MVP (2–4 weeks)

This is the main development priority.

### Development

1. Rework the current apartment-oriented model into universal comparison:
   - categories
   - products/items
   - specs/attributes
   - comparison table
2. Seed **1–2 curated categories** internally, not via UGC:
   - GPUs
   - smartphones / laptops / headphones
3. Ship public category pages and comparison pages
4. Add saved comparisons for signed-in users
5. Add a paywall on 1–2 clear paid features
6. Connect billing v1 through Stripe / Lemon Squeezy / Paddle
7. Enforce entitlement checks via `@playground/entitlements`

### Product

8. Write the `Compare` landing page
9. Define the value proposition:
   - "Compare products side by side with structured specs"
10. Prepare 5–10 SEO pages for concrete queries:
   - `RTX 4070 vs RTX 4060 Ti`
   - `best budget GPU 2026`
   - `iPhone vs Samsung comparison`

**Outcome:** `Compare` can be shown to users and can take payment.

## Phase 3 — Steps as Acquisition Channel (2–3 weeks, second priority)

Do not make `Steps` as large as `Compare` at this stage.

### Development

1. Complete the user flow:
   - browse guide
   - start guide
   - mark step done
   - resume later
2. Publish 3–5 public guides:
   - required documents for process X
   - how to complete complex path Y
3. Add SEO meta for public guide pages
4. Require login only where saved progress is needed

### Product / Marketing

5. Publish guides as SEO/community assets
6. Link from guides into `Compare` only where it is genuinely useful

**Outcome:** `Steps` brings organic traffic without distracting from
monetization.

## Phase 4 — Analytics and Launch (1 week)

1. Connect Plausible
2. Connect Sentry
3. Track only key events:
   - `landing_viewed`
   - `signup_completed`
   - `activation_completed`
   - `paywall_viewed`
   - `checkout_started`
   - `subscription_started`
4. Set up a weekly review dashboard
5. Add a cookie banner only if ad/analytics cookies are enabled

See [`analytics-and-cookies.md`](analytics-and-cookies.md) for details.

**Outcome:** you can see where users drop, not just that traffic exists.

## Phase 5 — Go-To-Market (after sellable Compare)

### Channel 1: SEO

1. Publish 10–20 comparison pages
2. Add internal links between `Main`, `Compare`, and `Steps`
3. Target long-tail comparison queries

### Channel 2: Reddit / Communities

1. Publish useful posts, not ads
2. Answer buying-advice threads
3. Link only when it genuinely helps

### Channel 3: Product-Led Growth

1. Free tier with a clear limit
2. Paywall at the moment of value, not at registration
3. Email/onboarding after signup

**Outcome:** first 100–500 users and first paying customers.

## What Not To Do Now

- Do not build 5 new MVPs
- Do not build a contributor marketplace in `Steps`
- Do not build mobile apps
- Do not build a complex multi-plan billing system
- Do not add GA4 and ad pixels before consent flow is ready
- Do not refactor the whole architecture for aesthetics
- Do not try to monetize About/Main

## Priority Order

1. Strategy and pricing
2. Auth/platform stability
3. `Compare` -> sellable universal product
4. Billing + entitlements
5. Landing + SEO for `Compare`
6. `Steps` -> 3–5 public guides
7. Analytics + weekly metrics review
8. Reddit/community distribution
9. Iterate based on activation and payment data

## Weekly KPIs

| Metric | Why it matters |
| --- | --- |
| Visitors -> signup | Product is understandable |
| Signup -> activation | Product delivers real value |
| Activation -> paywall view | Users reach monetization |
| Paywall -> paid | Pricing and boundary work |
| 7-day retention | Repeat usage exists |
| SEO pages indexed | Organic channel works |
| Support issues | Product does not consume too much time |

## Hard CEO Focus

If resources are limited, set only **3 big goals for the next month**:

1. `Compare` v1 for universal product comparison
2. Billing + paywall
3. 10 SEO/comparison landing pages

Everything else is wave two.

## 30-Day Backlog

### Week 1

- Confirm positioning and pricing
- Stabilize auth
- Privacy / Terms / About
- Rewrite product copy on `Main`

### Week 2

- Compare data model for categories / products / specs
- Launch 1 curated category
- Public comparison page

### Week 3

- Saved comparisons
- Paywall
- Stripe / Lemon integration
- Entitlements in API

### Week 4

- Landing + 5 SEO pages
- Plausible + Sentry
- Launch Reddit/SEO tests
- First conversion review

## Repository Epics (Suggested)

When this roadmap is approved, break work into these epics:

1. **Compare universalization**
   - category/product/spec model
   - curated seed data
   - public comparison UX
2. **Billing**
   - provider integration
   - subscription state
   - entitlement middleware
3. **Steps SEO guides**
   - public guide pages
   - progress/resume flow
   - SEO metadata
4. **Analytics**
   - Plausible
   - Sentry
   - shared event schema

## Open Decisions For Review

Please confirm:

1. First paid boundary for `Compare`
2. v1 pricing
3. Billing provider: Stripe vs Lemon Squeezy vs Paddle
4. First 1–2 categories to seed in `Compare`
5. First 3–5 guides to publish in `Steps`
