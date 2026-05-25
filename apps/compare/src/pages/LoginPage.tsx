import { useNavigate } from 'react-router-dom'

import { LoginForm } from '@playground/auth-react'
import { useAuth } from '@/contexts/AuthContext'
import { useI18n } from '@/contexts/I18nContext'
import { ApiError } from '@/lib/api'

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { t } = useI18n()

  return (
    <LoginForm
      labels={{
        title: t('login.title'),
        subtitle: t('login.subtitle'),
        email: t('login.email'),
        password: t('login.password'),
        emailPlaceholder: t('login.placeholderEmail'),
        passwordPlaceholder: t('login.placeholderPassword'),
        submit: t('login.signIn'),
        submitPending: t('login.signingIn'),
        noAccount: t('login.noAccount'),
        createAccount: t('login.createOne')
      }}
      onSubmit={async (input) => {
        await login(input)
        navigate('/compare', { replace: true })
      }}
      resolveError={(err) =>
        err instanceof ApiError ? err.message : t('login.failedGeneric')
      }
    />
  )
}
