import { ReactNode, useCallback } from 'react'

export function I18nProvider({ children }: { children: ReactNode }) {
  const locale = 'en' // TODO: read locale from user/stored value

  const t = useCallback(
    (id: MessageId, vars?: Record<string, string | number>) =>
      translate(locale, id, vars),
    [locale]
  )
}
