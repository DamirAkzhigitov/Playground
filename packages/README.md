# Shared packages

Cross-app code for da-mr.com tools.

| Package | Purpose |
| ------- | ------- |
| `@playground/global-header` | Sticky nav bar injected in tool app HTML |
| `@playground/auth-core` | Worker auth: Better Auth + D1, Hono mount + session middleware |
| `@playground/auth-react` | React auth: Better Auth client, login/register forms, route guard |
| `@playground/entitlements` | Shared product, plan, and feature entitlement definitions |

Conventions (planned / future):

- `@playground/eslint-config` — shared ESLint flat config
- `@playground/tsconfig` — shared base `tsconfig.json`
- `@playground/ui` — shared shadcn-style components

## Auth packages

See [`auth-core/README.md`](auth-core/README.md) and [`auth-react/README.md`](auth-react/README.md).

Full doc map: [`../DOCS.md`](../DOCS.md) → Authentication & authorization.

Worker apps use `createPlaygroundAuth()`, `mountAuthHandler()`, and
`createSessionMiddleware()` from `@playground/auth-core`. React tools use
`createAuthProvider()` and form components from `@playground/auth-react`.

OAuth (Google, Facebook, etc.), cross-subdomain SSO, and the guest vs
signed-in access model are documented in
[`auth-core/OAUTH.md`](auth-core/OAUTH.md),
[`auth-core/SSO.md`](auth-core/SSO.md), and
[`auth-core/AUTHORIZATION.md`](auth-core/AUTHORIZATION.md).

## Product access

The product family strategy is documented in
[`../docs/product-family.md`](../docs/product-family.md). Use
`@playground/entitlements` as the shared contract for plan names, product IDs,
and feature gates before wiring a billing provider.
