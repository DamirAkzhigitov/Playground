import { useSearchParams } from 'react-router-dom'

import { buildAuthLoginUrl, RegisterForm } from '@playground/auth-react'
import { useAuth } from '@/contexts/AuthContext'
import { readReturnUrl } from '@/lib/returnUrl'

export function RegisterPage() {
  const { register } = useAuth()
  const [search] = useSearchParams()
  const returnUrl = readReturnUrl(search)
  const loginHref = buildAuthLoginUrl(returnUrl)

  return (
    <RegisterForm
      labels={{
        title: 'Create account',
        subtitle: 'Register once to use Compare, Steps, and future tools.',
        email: 'Email',
        password: 'Password',
        confirmPassword: 'Confirm password',
        emailPlaceholder: 'you@example.com',
        submit: 'Create account',
        submitPending: 'Creating account…',
        haveAccount: 'Already have an account?',
        signIn: 'Sign in',
        passwordsMismatch: 'Passwords do not match.'
      }}
      loginHref={loginHref}
      onSubmit={async (input) => {
        await register(input)
        window.location.assign(returnUrl)
      }}
      resolveError={() => 'Registration failed. Try a different email.'}
    />
  )
}
