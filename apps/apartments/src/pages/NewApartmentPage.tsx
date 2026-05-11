import { ChevronLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { ApartmentForm } from '@/components/ApartmentForm'
import { PinnedActionBar } from '@/components/layout/PinnedActionBar'
import type { ApartmentFormValues } from '@/lib/apartmentForm'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useCreateApartment } from '@/hooks'

const emptyDefaults: ApartmentFormValues = {
  title: '',
  address: '',
  notes: '',
  price: ''
}

export function NewApartmentPage() {
  const navigate = useNavigate()
  const createMutation = useCreateApartment()

  return (
    <section className="space-y-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
      <PageHeader
        title="Create apartment"
        description="Start tracking a new place you're considering."
      />
      <Card>
        <CardContent className="pt-6">
          <ApartmentForm
            defaultValues={emptyDefaults}
            onSubmit={async (payload) => {
              try {
                const created = await createMutation.mutateAsync(payload)
                toast.success('Apartment created.')
                navigate(`/apartments/${created.id}`)
              } catch (e) {
                toast.error(
                  e instanceof Error ? e.message : 'Could not create apartment.'
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
          disabled={createMutation.isPending}
          form="apartment-form"
          type="submit"
        >
          Create apartment
        </Button>
      </PinnedActionBar>
    </section>
  )
}
