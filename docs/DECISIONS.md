# Product & Launch Decisions

Single source of truth for locked decisions.  
Week 1 tasks: [`week-1-tasks.md`](week-1-tasks.md).

**Status:** Draft — fill rows as `D-*` tasks close.

---

## Week 1 — Locked _(date: 2026-06-14)_

| ID | Decision | Answer | Owner | Date |
| --- | --- | --- | --- | --- |
| D-01 | Compare positioning (public message) | **Universal structured product comparison** (see paragraph below). "Apartment inspection tool" is retired as the customer-facing story. | Founder | 2026-06-14 |
| D-02 | First paid boundary for Compare | **`export`** (JSON/XLSX export of a comparison). Browse + compare stay free; export is the v1 Pro gate. | Founder | 2026-06-14 |
| D-03 | v1 pricing | **Single Pro plan: `$9/mo` or `$49/yr`** (annual ~55% off to push yearly). No Founder tier in v1. | Founder | 2026-06-14 |
| D-04 | Billing provider | **Lemon Squeezy** (Merchant of Record — handles EU VAT/sales tax for solo-dev ops; Paddle is the fallback). | Founder | 2026-06-14 |
| D-05 | Legal approach + entity + contact email | _TBD_ | | |
| D-06 | Compare seed categories (1–2) + example pairs | _TBD_ | | |
| D-07 | Steps guides to publish (3 titles/slugs) | _TBD_ | | |
| D-08 | Main site copy approved | _TBD_ (link to PR or copy doc) | | |
| D-09 | Compare public vs account-only | **Current:** account-only (see [`packages/auth-core/AUTHORIZATION.md`](../packages/auth-core/AUTHORIZATION.md)). **Target matrix:** below — fill Public/Account/Pro columns when locked. | | |

### D-01 — Compare positioning (locked paragraph)

> **Compare** (`compare.da-mr.com`) is a universal, structured product-comparison
> tool: it lets anyone put products, services, tools, or options side by side
> using structured specs, filters, and saveable decisions — across categories
> like GPUs, phones, and laptops. The customer-facing message is **"compare
> anything objectively, side by side"**, not "apartment inspection." The legacy
> apartment/listings model is an internal implementation detail being generalized
> in Week 2 (see roadmap Phase 2) and must **not** appear in marketing, the main
> site, or Compare's public copy.

This unblocks `D-02`–`D-04`, `C-07` (main copy), `C-08` (cross-links), and the
Week 2 schema universalization.

### D-02 — First paid boundary (rationale)

`export` chosen over `premium categories` / `saved history` / `advanced filters`
because it is the cleanest "paywall at the moment of value" (per roadmap Phase 5)
and the lowest-effort to enforce at a feature boundary via
`@playground/entitlements`. Keeping browse + comparison fully free protects the
SEO/community funnel that Compare depends on. Saved history and advanced filters
remain candidates for the next paid feature once `export` validates willingness
to pay.

### D-03 — v1 pricing (rationale)

Single **Pro** plan only (roadmap range was `$9–19/mo` or `$49/yr`). `$9/mo`
keeps the monthly entry low; `$49/yr` is a strong annual discount to bias toward
yearly commitment and reduce churn ops for a solo dev. No `Founder` tier in v1 to
avoid a multi-plan billing system (explicitly out of scope per roadmap).

### D-04 — Billing provider (rationale)

**Lemon Squeezy** is a Merchant of Record: it remits EU VAT and global sales tax
on your behalf, which removes the biggest tax/compliance burden for an EU-based
solo dev. Paddle (also MoR) is the fallback if Lemon Squeezy limits surface.
Plain Stripe was not chosen for v1 because it leaves you as the merchant of
record responsible for VAT filing.

### D-09 — Compare access matrix

| Surface | Public | Account | Pro |
| --- | --- | --- | --- |
| Category browse | | | |
| Product comparison view | | | |
| Save comparison | | | |
| Export JSON/XLSX | | | |
| Legacy listings / custom questions | | | |
| Settings / profile | | | |

---

## Week 2+ _(add sections when decisions land)_

<!-- Pricing experiments, channel focus, etc. -->
