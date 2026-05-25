import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { AuthFormError } from './AuthFormError.js'
import { AuthFormLayout } from './AuthFormLayout.js'
import type { RegisterInput } from './types.js'

export type RegisterFormLabels = {
  title: string
  subtitle: string
  email: string
  password: string
  confirmPassword: string
  emailPlaceholder?: string
  passwordPlaceholder?: string
  repeatPasswordPlaceholder?: string
  submit: string
  submitPending: string
  haveAccount: string
  signIn: string
  passwordsMismatch: string
}

export type RegisterFormProps = {
  labels: RegisterFormLabels
  onSubmit: (input: RegisterInput) => Promise<void>
  loginHref?: string
  resolveError?: (err: unknown) => string
}

export function RegisterForm({
  labels,
  onSubmit,
  loginHref = '/login',
  resolveError
}: RegisterFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [isPending, setIsPending] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)
    if (password !== confirm) {
      setFormError(labels.passwordsMismatch)
      return
    }
    setIsPending(true)
    try {
      await onSubmit({ email, password })
    } catch (err) {
      setFormError(resolveError?.(err) ?? 'Registration failed. Try again.')
    } finally {
      setIsPending(false)
    }
  }

  const footer: ReactNode = (
    <p className="text-center text-sm text-muted-foreground">
      {labels.haveAccount}{' '}
      <Link to={loginHref} className="font-medium text-primary underline">
        {labels.signIn}
      </Link>
    </p>
  )

  return (
    <AuthFormLayout
      title={labels.title}
      subtitle={labels.subtitle}
      footer={footer}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthFormError message={formError} />

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
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setFormError(null)
            }}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="confirm" className="text-sm font-medium">
            {labels.confirmPassword}
          </label>
          <input
            id="confirm"
            type="password"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            placeholder={labels.repeatPasswordPlaceholder}
            autoComplete="new-password"
            required
            minLength={8}
            value={confirm}
            onChange={(e) => {
              setConfirm(e.target.value)
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
