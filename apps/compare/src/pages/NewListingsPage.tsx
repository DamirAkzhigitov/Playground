import { ChevronLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { useI18n } from '@/contexts/I18nContext'
import { ListingForm } from '@/components/ListingForm.tsx'
import { PinnedActionBar } from '@/components/layout/PinnedActionBar'
import type { ListingFormValues } from '@/lib/listingForm.ts'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useCreateListing } from '@/hooks'

const emptyDefaults: ListingFormValues = {
  title: '',
  address: '',
  notes: '',
  price: ''
}

export function NewListingsPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const createMutation = useCreateListing()

  return (
    <section className="pb-page-pinned space-y-4">
      <PageHeader
        title={t('newApartment.title')}
        description={t('newApartment.description')}
      />
      <Card>
        <CardContent className="pt-6">
          <ListingForm
            defaultValues={emptyDefaults}
            onSubmit={async (payload) => {
              try {
                const created = await createMutation.mutateAsync(payload)
                toast.success(t('newApartment.created'))
                navigate(`/listings/${created.id}`)
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
            to="/listings"
            className="inline-flex items-center justify-center gap-1"
          >
            <ChevronLeft aria-hidden className="size-4 shrink-0" />
            {t('common.back')}
          </Link>
        </Button>
        <Button
          className="min-h-11 inline-flex flex-1 items-center justify-center gap-1"
          disabled={createMutation.isPending}
          form="listing-form"
          type="submit"
        >
          {t('newApartment.submit')}
        </Button>
      </PinnedActionBar>
    </section>
  )
}
