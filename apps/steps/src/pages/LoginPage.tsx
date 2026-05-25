import { useNavigate, useSearchParams } from 'react-router-dom'

import { LoginForm } from '@playground/auth-react'
import { useAuth } from '@/contexts/AuthContext'
import { ApiError } from '@/lib/api'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [search] = useSearchParams()
  const returnUrl = search.get('returnUrl') || '/my'

  const registerHref =
    returnUrl !== '/my'
      ? `/register?returnUrl=${encodeURIComponent(returnUrl)}`
      : '/register'

  return (
    <LoginForm
      labels={{
        title: 'Sign in',
        subtitle: 'Access your saved guides and progress.',
        email: 'Email',
        password: 'Password',
        emailPlaceholder: 'you@example.com',
        submit: 'Sign in',
        submitPending: 'Signing in…',
        noAccount: 'No account?',
        createAccount: 'Create one'
      }}
      registerHref={registerHref}
      onSubmit={async (input) => {
        await login(input)
        navigate(returnUrl, { replace: true })
      }}
      resolveError={(err) =>
        err instanceof ApiError ? err.message : 'Sign in failed. Try again.'
      }
    />
  )
}
