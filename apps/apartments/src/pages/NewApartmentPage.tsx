import { ChevronLeft } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { useI18n } from '@/contexts/I18nContext'
import { ApartmentForm } from '@/components/ApartmentForm'
import { PinnedActionBar } from '@/components/layout/PinnedActionBar'
import type { ApartmentFormValues } from '@/lib/apartmentForm'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useCreateApartment, useInspectionTemplates } from '@/hooks'

const emptyDefaults: ApartmentFormValues = {
  title: '',
  address: '',
  notes: '',
  price: ''
}

export function NewApartmentPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const createMutation = useCreateApartment()
  const templatesQuery = useInspectionTemplates()
  const [templateSlug, setTemplateSlug] = useState('standard-residential')
  const templateOptions = useMemo(
    () => templatesQuery.data ?? [],
    [templatesQuery.data]
  )
  const effectiveTemplateSlug = useMemo(() => {
    if (templateOptions.length === 0) {
      return templateSlug
    }
    if (templateOptions.some((t) => t.slug === templateSlug)) {
      return templateSlug
    }
    return templateOptions[0]?.slug ?? templateSlug
  }, [templateOptions, templateSlug])

  const selectedTemplateDescription = useMemo(
    () =>
      templateOptions.find((t) => t.slug === effectiveTemplateSlug)
        ?.description,
    [templateOptions, effectiveTemplateSlug]
  )

  return (
    <section className="pb-page-pinned space-y-4">
      <PageHeader
        title={t('newApartment.title')}
        description={t('newApartment.description')}
      />
      <Card>
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-2">
            <Label htmlFor="inspection-template">
              {t('newApartment.templateLabel')}
            </Label>
            {templatesQuery.isPending ? (
              <p className="text-sm text-muted-foreground">
                {t('newApartment.loadingTemplates')}
              </p>
            ) : null}
            {templatesQuery.isError ? (
              <p className="text-sm text-destructive">
                {templatesQuery.error.message}
              </p>
            ) : null}
            {!templatesQuery.isPending && !templatesQuery.isError ? (
              <>
                <Select
                  value={effectiveTemplateSlug}
                  onValueChange={setTemplateSlug}
                  disabled={templateOptions.length === 0}
                >
                  <SelectTrigger
                    id="inspection-template"
                    className="min-h-11 w-full"
                    aria-label={t('newApartment.templateAria')}
                  >
                    <SelectValue
                      placeholder={t('newApartment.templatePlaceholder')}
                    />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {templateOptions.map((t) => (
                      <SelectItem key={t.slug} value={t.slug}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedTemplateDescription ? (
                  <p className="text-sm text-muted-foreground">
                    {selectedTemplateDescription}
                  </p>
                ) : null}
              </>
            ) : null}
          </div>

          <ApartmentForm
            defaultValues={emptyDefaults}
            onSubmit={async (payload) => {
              try {
                const created = await createMutation.mutateAsync({
                  ...payload,
                  templateSlug: effectiveTemplateSlug
                })
                toast.success(t('newApartment.created'))
                navigate(`/apartments/${created.id}`)
              } catch (e) {
                toast.error(
                  e instanceof Error
                    ? e.message
                    : t('newApartment.createFailed')
                )
              }
            }}
          />
        </CardContent>
      </Card>

      <PinnedActionBar>
        <Button variant="outline" className="min-h-11 flex-1" asChild>
          <Link
            to="/apartments"
            className="inline-flex items-center justify-center gap-1"
          >
            <ChevronLeft aria-hidden className="size-4 shrink-0" />
            {t('common.back')}
          </Link>
        </Button>
        <Button
          className="min-h-11 inline-flex flex-1 items-center justify-center gap-1"
          disabled={
            createMutation.isPending ||
            templatesQuery.isPending ||
            templatesQuery.isError
          }
          form="apartment-form"
          type="submit"
        >
          {t('newApartment.submit')}
        </Button>
      </PinnedActionBar>
    </section>
  )
}
