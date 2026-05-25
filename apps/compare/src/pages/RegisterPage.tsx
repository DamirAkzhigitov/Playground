import { useNavigate } from 'react-router-dom'

import { RegisterForm } from '@playground/auth-react'
import { useAuth } from '@/contexts/AuthContext'
import { useI18n } from '@/contexts/I18nContext'
import { ApiError } from '@/lib/api'

export function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const { t } = useI18n()

  return (
    <RegisterForm
      labels={{
        title: t('register.title'),
        subtitle: t('register.subtitle'),
        email: t('login.email'),
        password: t('login.password'),
        confirmPassword: t('register.confirmPassword'),
        emailPlaceholder: t('login.placeholderEmail'),
        passwordPlaceholder: t('login.placeholderPassword'),
        repeatPasswordPlaceholder: t('register.repeatPassword'),
        submit: t('register.submit'),
        submitPending: t('register.submitting'),
        haveAccount: t('register.haveAccount'),
        signIn: t('register.signIn'),
        passwordsMismatch: t('register.passwordsMismatch')
      }}
      onSubmit={async (input) => {
        await register(input)
        navigate('/compare', { replace: true })
      }}
      resolveError={(err) =>
        err instanceof ApiError ? err.message : t('register.failedGeneric')
      }
    />
  )
}
