import { ChevronLeft } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { ApartmentForm } from '@/components/ApartmentForm'
import { PinnedActionBar } from '@/components/layout/PinnedActionBar'
import { apartmentFormDefaults } from '@/lib/apartmentForm'
import { ErrorState } from '@/components/ErrorState'
import { LoadingState } from '@/components/LoadingState'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
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

  const showForm = !isPending && !isError && data && defaults

  return (
    <section className={showForm ? 'space-y-4 pb-page-pinned' : 'space-y-4'}>
      <PageHeader
        title="Edit apartment"
        description="Update listing details."
      />

      {isPending ? <LoadingState label="Loading apartment…" /> : null}
      {isError ? <ErrorState message={error.message} /> : null}

      {showForm ? (
        <>
          <Card>
            <CardContent className="pt-6">
              <ApartmentForm
                key={data.id}
                defaultValues={defaults}
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

          <PinnedActionBar>
            <Button variant="outline" className="min-h-11 flex-1" asChild>
              <Link
                to={`/apartments/${data.id}`}
                className="inline-flex items-center justify-center gap-1"
              >
                <ChevronLeft aria-hidden className="size-4 shrink-0" />
                Back
              </Link>
            </Button>
            <Button
              className="min-h-11 inline-flex flex-1 items-center justify-center gap-1"
              disabled={updateMutation.isPending}
              form="apartment-form"
              type="submit"
            >
              Save changes
            </Button>
          </PinnedActionBar>
        </>
      ) : null}
    </section>
  )
}
