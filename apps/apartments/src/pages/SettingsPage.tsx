import { toast } from 'sonner'

import { useAuth } from '@/contexts/AuthContext'
import { useI18n } from '@/contexts/I18nContext'
import { PageHeader } from '@/components/PageHeader'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { APP_LOCALES, LOCALE_LABELS, type AppLocale } from '@/i18n/locale'
import { ApiError } from '@/lib/api'

export function SettingsPage() {
  const { user, updateLocale } = useAuth()
  const { t } = useI18n()
  const current = user?.locale ?? 'en'

  return (
    <section className="space-y-6">
      <PageHeader
        title={t('settings.title')}
        description={t('settings.description')}
      />

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.language')}</CardTitle>
          <CardDescription>{t('settings.languageHint')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="locale-select">{t('settings.language')}</Label>
            <Select
              value={current}
              onValueChange={async (v) => {
                const next = v as AppLocale
                if (next === current) return
                try {
                  await updateLocale(next)
                  toast.success(t('settings.saved'))
                } catch (err) {
                  const message =
                    err instanceof ApiError
                      ? err.message
                      : t('settings.saveFailed')
                  toast.error(message)
                }
              }}
            >
              <SelectTrigger id="locale-select" className="max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {APP_LOCALES.map((code) => (
                  <SelectItem key={code} value={code}>
                    {LOCALE_LABELS[code]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
