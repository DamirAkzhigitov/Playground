import { ChevronLeft } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

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
        title="Create listing"
        description="Pick a checklist template, then add the basics. You can compare cars, rentals, off-plan units, and more side by side."
      />
      <Card>
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-2">
            <Label htmlFor="inspection-template">Checklist template</Label>
            {templatesQuery.isPending ? (
              <p className="text-sm text-muted-foreground">
                Loading templates…
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
                    aria-label="Inspection checklist template"
                  >
                    <SelectValue placeholder="Choose a template" />
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
                toast.success('Listing created.')
                navigate(`/apartments/${created.id}`)
              } catch (e) {
                toast.error(
                  e instanceof Error ? e.message : 'Could not create listing.'
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
            Back
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
          Create listing
        </Button>
      </PinnedActionBar>
    </section>
  )
}
