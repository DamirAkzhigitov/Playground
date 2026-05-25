# @playground/auth-core

Shared cookie-session authentication for Cloudflare Workers (Hono + D1).

## Usage

```ts
import { createAuthRoutes, requireAuth } from '@playground/auth-core'

export const auth = createAuthRoutes<AppEnv>({
  insertUser: async (db, { userId, email, passwordHash, now }) => {
    await db
      .prepare(
        'INSERT INTO users (id, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)'
      )
      .bind(userId, email, passwordHash, 'user', now)
      .run()
  },
  selectUserForLogin: async (db, email) => { /* ... */ },
  selectUserForMe: async (db, userId) => { /* ... */ },
  formatAuthUser: (row) => ({
    id: row.id,
    email: row.email,
    createdAt: row.created_at
  }),
  onAfterRegister: async (db, userId) => {
    /* optional seed data */
  },
  registerExtraRoutes: (router) => {
    /* e.g. PATCH /me for locale */
  },
  sessionCookieOptions: { domain: '.da-mr.com' } // optional SSO
})
```

Mount in the Worker: `app.route('/api/auth', auth)`.

## API

- `POST /register`, `POST /login`, `POST /logout`, `GET /me`
- `requireAuth`, `requireAuthWithRole`, `hasMinimumRole`
- `hashPassword`, `verifyPassword` (PBKDF2-SHA256, 100k iterations)

## See also

- [OAUTH.md](./OAUTH.md) — adding Google / Facebook via Better Auth
- [SSO.md](./SSO.md) — one login across `*.da-mr.com`
