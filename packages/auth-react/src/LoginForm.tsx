import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { AuthFormError } from './AuthFormError.js'
import { AuthFormLayout } from './AuthFormLayout.js'
import type { LoginInput } from './types.js'

export type SocialProvider = 'google' | 'facebook'

export type LoginFormLabels = {
  title: string
  subtitle: string
  email: string
  password: string
  emailPlaceholder?: string
  passwordPlaceholder?: string
  submit: string
  submitPending: string
  noAccount: string
  createAccount: string
  continueWithGoogle?: string
  continueWithFacebook?: string
  orContinueWith?: string
}

export type LoginFormProps = {
  labels: LoginFormLabels
  onSubmit: (input: LoginInput) => Promise<void>
  registerHref?: string
  resolveError?: (err: unknown) => string
  socialProviders?: SocialProvider[]
  onSocialSignIn?: (provider: SocialProvider) => Promise<void>
}

export function LoginForm({
  labels,
  onSubmit,
  registerHref = '/register',
  resolveError,
  socialProviders = [],
  onSocialSignIn
}: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isPending, setIsPending] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setIsPending(true)
    try {
      await onSubmit({ email, password })
    } catch (err) {
      setFormError(resolveError?.(err) ?? 'Sign in failed. Try again.')
    } finally {
      setIsPending(false)
    }
  }

  const handleSocial = async (provider: SocialProvider) => {
    if (!onSocialSignIn) return
    setFormError(null)
    setIsPending(true)
    try {
      await onSocialSignIn(provider)
    } catch (err) {
      setFormError(resolveError?.(err) ?? 'Social sign-in failed. Try again.')
    } finally {
      setIsPending(false)
    }
  }

  const footer: ReactNode = (
    <p className="text-center text-sm text-muted-foreground">
      {labels.noAccount}{' '}
      <Link to={registerHref} className="font-medium text-primary underline">
        {labels.createAccount}
      </Link>
    </p>
  )

  const showSocial = socialProviders.length > 0 && onSocialSignIn

  return (
    <AuthFormLayout
      title={labels.title}
      subtitle={labels.subtitle}
      footer={footer}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthFormError message={formError} />

        {showSocial ? (
          <SocialSection
            labels={labels}
            providers={socialProviders}
            disabled={isPending}
            onSelect={handleSocial}
          />
        ) : null}

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            {labels.email}
          </label>
          <input
            id="email"
            type="email"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            placeholder={labels.emailPlaceholder}
            autoComplete="email"
            required
            value={email}
            disabled={isPending}
            onChange={(e) => {
              setEmail(e.target.value)
              setFormError(null)
            }}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">
            {labels.password}
          </label>
          <input
            id="password"
            type="password"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            placeholder={labels.passwordPlaceholder}
            autoComplete="current-password"
            required
            minLength={8}
            value={password}
            disabled={isPending}
            onChange={(e) => {
              setPassword(e.target.value)
              setFormError(null)
            }}
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
        >
          {isPending ? labels.submitPending : labels.submit}
        </button>
      </form>
    </AuthFormLayout>
  )
}

function SocialSection({
  labels,
  providers,
  disabled,
  onSelect
}: {
  labels: LoginFormLabels
  providers: SocialProvider[]
  disabled: boolean
  onSelect: (provider: SocialProvider) => Promise<void>
}) {
  return (
    <div className="space-y-3">
      {providers.includes('google') ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => onSelect('google')}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
        >
          {labels.continueWithGoogle ?? 'Continue with Google'}
        </button>
      ) : null}
      {providers.includes('facebook') ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => onSelect('facebook')}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
        >
          {labels.continueWithFacebook ?? 'Continue with Facebook'}
        </button>
      ) : null}
      {labels.orContinueWith ? (
        <p className="text-center text-xs text-muted-foreground">
          {labels.orContinueWith}
        </p>
      ) : null}
    </div>
  )
}
