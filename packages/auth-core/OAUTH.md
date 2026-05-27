# OAuth (Google, Facebook)

`@playground/auth-core` uses **Better Auth** with optional social providers. Email/password
is always enabled.

## Configure a tool Worker

1. Run Better Auth migrations (`packages/auth-core/sql/better-auth.sql` or app migration
   that includes those tables).
2. Set bindings (local: `apps/<tool>/worker/.dev.vars`; prod: Wrangler secrets):

   | Secret | Example |
   | ------ | ------- |
   | `BETTER_AUTH_SECRET` | random 32+ chars |
   | `BETTER_AUTH_URL` | `https://steps.da-mr.com` |
   | `BETTER_AUTH_TRUSTED_ORIGINS` | `http://localhost:3003` (Vite dev) |
   | `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | from Google Cloud console |
   | `FACEBOOK_CLIENT_ID` / `FACEBOOK_CLIENT_SECRET` | optional |

3. Register OAuth redirect URIs per tool, e.g.
   `https://steps.da-mr.com/api/auth/callback/google`.
4. In React, pass `socialProviders` + `onSocialSignIn` to `LoginForm` (see compare
   `AuthContext` `signInWithSocial`).

Providers are only registered when both client id and secret are present (`create-auth.ts`).

## Local dev

Vite serves the SPA; `/api` proxies to Wrangler. The browser `Origin` is the Vite URL, so add
it to `BETTER_AUTH_TRUSTED_ORIGINS` or sign-up returns `INVALID_ORIGIN`.

Smoke test: `scripts/smoke-auth.sh` (steps + compare Workers).

## Cross-subdomain SSO + OAuth

If you enable `AUTH_COOKIE_DOMAIN=.da-mr.com`, use one shared auth D1 and the same
`BETTER_AUTH_SECRET` on all tools. Add every tool origin to `BETTER_AUTH_TRUSTED_ORIGINS`.
See [SSO.md](./SSO.md).

## References

- [Hono + Better Auth on Cloudflare](https://hono.dev/examples/better-auth-on-cloudflare)
- [Better Auth docs](https://www.better-auth.com/docs)
