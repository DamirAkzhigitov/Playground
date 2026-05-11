import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { ApartmentForm } from '@/components/ApartmentForm'
import type { ApartmentFormValues } from '@/lib/apartmentForm'
import { PageHeader } from '@/components/PageHeader'
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
    <section className="space-y-4">
      <PageHeader
        title="Create apartment"
        description="Start tracking a new place you're considering."
      />
      <Card>
        <CardContent className="pt-6">
          <ApartmentForm
            defaultValues={emptyDefaults}
            submitLabel="Create apartment"
            isPending={createMutation.isPending}
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
    </section>
  )
}
