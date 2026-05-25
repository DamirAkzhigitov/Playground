# Shared packages

Cross-app code for da-mr.com tools.

| Package | Purpose |
| ------- | ------- |
| `@playground/global-header` | Sticky nav bar injected in tool app HTML |
| `@playground/auth-core` | Worker auth: PBKDF2 passwords, D1 sessions, Hono routes |
| `@playground/auth-react` | React auth context, login/register forms, route guard |

Conventions (planned / future):

- `@playground/eslint-config` — shared ESLint flat config
- `@playground/tsconfig` — shared base `tsconfig.json`
- `@playground/ui` — shared shadcn-style components

## Auth packages

See [`auth-core/README.md`](auth-core/README.md) and [`auth-react/README.md`](auth-react/README.md).

Worker apps mount `createAuthRoutes()` from `@playground/auth-core`. React tools use
`createAuthProvider()` and form components from `@playground/auth-react`.

OAuth (Google, Facebook, etc.) and cross-subdomain SSO are documented in
[`auth-core/OAUTH.md`](auth-core/OAUTH.md) and [`auth-core/SSO.md`](auth-core/SSO.md).
