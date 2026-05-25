import { useNavigate, useSearchParams } from 'react-router-dom'

import { RegisterForm } from '@playground/auth-react'
import { useAuth } from '@/contexts/AuthContext'
import { ApiError } from '@/lib/api'

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [search] = useSearchParams()
  const returnUrl = search.get('returnUrl') || '/my'

  const loginHref =
    returnUrl !== '/my'
      ? `/login?returnUrl=${encodeURIComponent(returnUrl)}`
      : '/login'

  return (
    <RegisterForm
      labels={{
        title: 'Create account',
        subtitle:
          'An account is required to save guide progress across devices.',
        email: 'Email',
        password: 'Password',
        confirmPassword: 'Confirm password',
        emailPlaceholder: 'you@example.com',
        submit: 'Create account',
        submitPending: 'Creating…',
        haveAccount: 'Already have an account?',
        signIn: 'Sign in',
        passwordsMismatch: 'Passwords do not match.'
      }}
      loginHref={loginHref}
      onSubmit={async (input) => {
        await register(input)
        navigate(returnUrl, { replace: true })
      }}
      resolveError={(err) =>
        err instanceof ApiError
          ? err.message
          : 'Registration failed. Try again.'
      }
    />
  )
}
