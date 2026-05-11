import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { ApartmentForm } from '@/components/ApartmentForm'
import { apartmentFormDefaults } from '@/lib/apartmentForm'
import { ErrorState } from '@/components/ErrorState'
import { LoadingState } from '@/components/LoadingState'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { useApartment, useUpdateApartment } from '@/hooks'

export function EditApartmentPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, isPending, isError, error } = useApartment(id)
  const updateMutation = useUpdateApartment()

  const defaults = useMemo(() => {
    if (!data) {
      return null
    }
    return apartmentFormDefaults(data)
  }, [data])

  return (
    <section className="space-y-4">
      <PageHeader
        title="Edit apartment"
        description="Update listing details."
      />

      {isPending ? <LoadingState label="Loading apartment…" /> : null}
      {isError ? <ErrorState message={error.message} /> : null}

      {!isPending && !isError && data && defaults ? (
        <Card>
          <CardContent className="pt-6">
            <ApartmentForm
              key={data.id}
              defaultValues={defaults}
              submitLabel="Save changes"
              isPending={updateMutation.isPending}
              onSubmit={async (payload) => {
                try {
                  await updateMutation.mutateAsync({
                    id: data.id,
                    payload
                  })
                  toast.success('Apartment updated.')
                  navigate(`/apartments/${data.id}`)
                } catch (e) {
                  toast.error(
                    e instanceof Error ? e.message : 'Could not save changes.'
                  )
                }
              }}
            />
          </CardContent>
        </Card>
      ) : null}
    </section>
  )
}
