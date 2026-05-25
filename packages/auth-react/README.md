# @playground/auth-react

Shared React auth for da-mr.com tool apps (Vite + React Router).

## Usage

```tsx
import { createAuthProvider, LoginForm, ProtectedRoute } from '@playground/auth-react'
import { apiRequest } from '@/lib/api'

const { AuthProvider, useAuth } = createAuthProvider<AuthUser>({
  apiRequest,
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

Add to app `index.css` for Tailwind class scanning:

```css
@source '../../../packages/auth-react/src';
```
