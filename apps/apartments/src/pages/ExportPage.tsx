import { PageHeader } from '@/components/PageHeader'
import { useI18n } from '@/contexts/I18nContext'
import { Card, CardContent } from '@/components/ui/card'

export function ExportPage() {
  const { t } = useI18n()
  return (
    <section className="space-y-4">
      <PageHeader
        title={t('export.title')}
        description={t('export.description')}
      />
      <Card>
        <CardContent className="py-4 text-sm text-muted-foreground">
          {t('export.placeholder')}
        </CardContent>
      </Card>
    </section>
  )
}
