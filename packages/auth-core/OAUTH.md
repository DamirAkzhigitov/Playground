# OAuth (Google, Facebook, etc.)

Current `@playground/auth-core` implements **email/password only**. Social login
requires a second phase.

## Recommended: Better Auth pilot (steps first)

[Better Auth](https://www.better-auth.com/) supports Hono on Cloudflare Workers,
D1/SQLite via Drizzle, and built-in Google/GitHub/Facebook providers.

### Steps to spike on `apps/steps`

1. Add deps to `apps/steps/worker`: `better-auth`, `drizzle-orm` (if using Drizzle adapter).
2. Generate schema: `users`, `sessions`, `accounts` (Better Auth tables) — new migration
   **alongside** or **replacing** custom tables after data migration plan.
3. Create `worker/src/better-auth.ts`:

   ```ts
   import { betterAuth } from 'better-auth'
   import { drizzleAdapter } from 'better-auth/adapters/drizzle'

   export function createAuth(env: Env) {
     return betterAuth({
       database: drizzleAdapter(db, { provider: 'sqlite' }),
       baseURL: env.BETTER_AUTH_URL,
       secret: env.BETTER_AUTH_SECRET,
       emailAndPassword: { enabled: true },
       socialProviders: {
         google: {
           clientId: env.GOOGLE_CLIENT_ID,
           clientSecret: env.GOOGLE_CLIENT_SECRET
         }
       }
     })
   }
   ```

4. Mount handler: `app.on(['POST', 'GET'], '/api/auth/*', (c) => createAuth(c.env).handler(c.req.raw))`
5. Store secrets in Cloudflare (not git): `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID`,
   `GOOGLE_CLIENT_SECRET`, callback URL `https://steps.da-mr.com/api/auth/callback/google`.
6. Add OAuth buttons to `@playground/auth-react` `LoginForm` (optional `socialProviders` slot).
7. Map Better Auth user id to existing `enrollments.user_id` if tables are merged.

References:

- [Hono + Better Auth on Cloudflare](https://hono.dev/examples/better-auth-on-cloudflare)
- [better-auth-cloudflare](https://github.com/zpg6/better-auth-cloudflare) examples

## Alternative: hosted Clerk / Auth0

Faster OAuth UX; users live outside D1 unless synced via webhooks. Same publishable
key can span subdomains for SSO.

## Alternative: keep custom + Arctic

[Arctic](https://arctic.js.org/) handles OAuth token exchange only; you still implement
account linking, CSRF, and session rows in D1. Higher effort than Better Auth.
