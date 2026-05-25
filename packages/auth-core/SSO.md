# Cross-subdomain SSO (`*.da-mr.com`)

Today each tool (`compare.da-mr.com`, `steps.da-mr.com`) has its **own D1 database**
and **host-only** `session` cookie. Logging in on one tool does **not** sign you in on another.

## Option A — Shared cookie domain (same session store)

Requires **one shared session table** (single D1 or replicated auth DB) and cookie:

```ts
sessionCookieOptions: { domain: '.da-mr.com' }
```

Pass this to `createAuthRoutes()` from `@playground/auth-core` (see `session.ts`).

Caveats:

- All apps must trust the same session ids and user ids, or map external ids consistently.
- `Secure` + `SameSite=Lax` still applies; subdomains must be HTTPS.
- Logout on one app should invalidate the shared session row.

## Option B — Central auth origin

Deploy `auth.da-mr.com` Worker that only handles login/register/OAuth. Tools redirect:

1. User hits `steps.da-mr.com/login` → redirect to `auth.da-mr.com/login?return=...`
2. Auth Worker sets cookie on `.da-mr.com`
3. Redirect back to tool; tool validates session via auth API or shared D1 read

## Option C — Hosted IdP (Clerk, Auth0)

One tenant; same client id on all subdomains. Session managed by provider; Workers verify
JWT or session token per request. Users not in app D1 unless synced.

## Default (MVP)

**Per-app auth** — no `cookieDomain`. Revisit SSO when product needs a single account
across compare, steps, and future tools.
