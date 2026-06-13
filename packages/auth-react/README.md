# @playground/auth-react

Shared React auth for da-mr.com tool apps (Vite + React Router).

## Usage

```tsx
import { createAuthProvider, LoginForm, ProtectedRoute } from '@playground/auth-react'

const { AuthProvider, useAuth } = createAuthProvider<AuthUser>({
  normalizeUser: (raw) => ({ id: raw.id as string, email: raw.email as string }),
  onLogoutClear: () => queryClient.clear()
})

// In router:
<ProtectedRoute auth={useAuth()} requiredRole="contributor">
  <ContributorPage />
</ProtectedRoute>
```

`LoginForm` / `RegisterForm` are presentational (labels via props); apps handle
`navigate()` after successful submit.

Cross-subdomain SSO (`.da-mr.com` cookies) needs no client changes — see
[`auth-core/SSO.md`](../auth-core/SSO.md).

## Guest vs protected routes

Not every app requires sign-in on every page. Prefer **narrow** guards:

```tsx
// Guest-friendly: only wrap account-only pages
<Route path="/" element={<AppLayout />}>
  <Route path="actions" element={<CatalogPage />} />
  <Route
    path="my"
    element={
      <ProtectedRoute auth={useAuth()} loginPath={buildAuthLoginUrl(window.location.href)}>
        <MyGuidesPage />
      </ProtectedRoute>
    }
  />
</Route>
```

Avoid wrapping `<AppLayout />` in `ProtectedRoute` unless the whole product is
account-only (Compare today).

For browse-without-login flows, show an inline sign-in CTA instead of redirecting
(Steps `SignInPrompt`). Disable authenticated TanStack Query calls with
`enabled: Boolean(user)`.

Full access matrix and Worker patterns:
[`auth-core/AUTHORIZATION.md`](../auth-core/AUTHORIZATION.md).

Add to app `index.css` for Tailwind class scanning:

```css
@source '../../../packages/auth-react/src';
```
