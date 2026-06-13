# @playground/auth-core

Shared authentication for Cloudflare Workers (Hono + D1) using
[Better Auth](https://www.better-auth.com/).

## Usage

```ts
import {
  createPlaygroundAuth,
  createSessionMiddleware,
  mountAuthHandler,
  requireAuth
} from '@playground/auth-core'

export function getAuth(env: AppEnv['Bindings']) {
  return createPlaygroundAuth(env, {
    appName: 'Steps',
    onAfterRegister: async (userId) => {
      /* optional seed data */
    }
  })
}

// In worker index.ts:
app.use('/api/*', createSessionMiddleware(getAuth))
mountAuthHandler(app, getAuth)
```

### Environment bindings

| Variable | Required | Purpose |
| -------- | -------- | ------- |
| `DB` | yes | D1 with Better Auth tables (see `sql/better-auth.sql`) |
| `BETTER_AUTH_SECRET` | yes | Session signing (min 32 chars) |
| `BETTER_AUTH_URL` | yes | Public app origin, e.g. `https://steps.da-mr.com` |
| `BETTER_AUTH_TRUSTED_ORIGINS` | no | Comma-separated extra origins (Vite dev) |
| `AUTH_DB` | yes (SSO) | Shared D1 `playground-auth-db`; auth migrations in `migrations/` |
| `AUTH_COOKIE_DOMAIN` | no (on in prod wrangler) | `.da-mr.com` for cross-subdomain SSO |
| `GOOGLE_CLIENT_*` / `FACEBOOK_CLIENT_*` | no | OAuth providers when set |

Store secrets with `wrangler secret put` (see `apps/*/worker/.dev.vars` for local dev).

### Optional SSO

```ts
createPlaygroundAuth(env, {
  appName: 'Compare',
  ssoCookieDomain: '.da-mr.com' // or AUTH_COOKIE_DOMAIN binding
})
```

Requires shared D1 + shared `BETTER_AUTH_SECRET` across tools. See [SSO.md](./SSO.md).

## API surface

- **Better Auth routes** (mounted at `/api/auth/*`): email/password sign-up/sign-in,
  `get-session`, sign-out, OAuth callbacks when providers are configured.
- **Middleware:** `createSessionMiddleware`, `requireAuth`, `requireAuthWithRole`,
  `hasMinimumRole` (`user` | `contributor` | `admin`).
- **Exports:** `authSchema`, `buildPlaygroundSsoOptions`, `mountAuthHandler`.

## Authorization (guests, roles, per-app matrix)

See [AUTHORIZATION.md](./AUTHORIZATION.md) for how guest vs signed-in access works
on Steps and Compare, Worker route patterns, and frontend guards.

## See also

- [AUTHORIZATION.md](./AUTHORIZATION.md) — guests, roles, public vs protected routes
- [OAUTH.md](./OAUTH.md) — Google / Facebook setup
- [SSO.md](./SSO.md) — one login across `*.da-mr.com`
