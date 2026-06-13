import { useSearchParams } from 'react-router-dom'

import { buildAuthRegisterUrl, LoginForm } from '@playground/auth-react'
import { useAuth } from '@/contexts/AuthContext'
import { readReturnUrl } from '@/lib/returnUrl'

export function LoginPage() {
  const { login } = useAuth()
  const [search] = useSearchParams()
  const returnUrl = readReturnUrl(search)
  const registerHref = buildAuthRegisterUrl(returnUrl)

  return (
    <LoginForm
      labels={{
        title: 'Sign in',
        subtitle: 'One account for all da-mr.com tools.',
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
        window.location.assign(returnUrl)
      }}
      resolveError={() => 'Sign in failed. Check your email and password.'}
    />
  )
}
