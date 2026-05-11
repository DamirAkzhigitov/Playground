import { ChevronLeft } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { ApartmentForm } from '@/components/ApartmentForm'
import { PinnedActionBar } from '@/components/layout/PinnedActionBar'
import { apartmentFormDefaults } from '@/lib/apartmentForm'
import { ErrorState } from '@/components/ErrorState'
import { LoadingState } from '@/components/LoadingState'
import { PageHeader } from '@/components/PageHeader'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { useApartment, useDeleteApartment, useUpdateApartment } from '@/hooks'

export function EditApartmentPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, isPending, isError, error } = useApartment(id)
  const updateMutation = useUpdateApartment()
  const deleteMutation = useDeleteApartment()
  const [removeOpen, setRemoveOpen] = useState(false)

  const defaults = useMemo(() => {
    if (!data) {
      return null
    }
    return apartmentFormDefaults(data)
  }, [data])

  const showForm = !isPending && !isError && data && defaults

  return (
    <section className={showForm ? 'space-y-4 pb-page-pinned' : 'space-y-4'}>
      <PageHeader title="Edit listing" description="Update listing details." />

      {isPending ? <LoadingState label="Loading listing…" /> : null}
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
                    toast.success('Listing updated.')
                    navigate(`/apartments/${data.id}`)
                  } catch (e) {
                    toast.error(
                      e instanceof Error ? e.message : 'Could not save changes.'
                    )
                  }
                }}
              />
            </CardContent>
            <CardFooter className="flex-col border-t pt-6">
              <Button
                className="min-h-11 w-full"
                disabled={deleteMutation.isPending}
                type="button"
                variant="destructive"
                onClick={() => setRemoveOpen(true)}
              >
                Remove listing
              </Button>
            </CardFooter>
          </Card>

          <AlertDialog
            onOpenChange={(open) => {
              if (!open && deleteMutation.isPending) {
                return
              }
              setRemoveOpen(open)
            }}
            open={removeOpen}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove this listing?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently deletes the listing, photos, and inspection
                  answers. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleteMutation.isPending}>
                  Cancel
                </AlertDialogCancel>
                <Button
                  className="min-h-11 sm:min-w-32"
                  disabled={deleteMutation.isPending}
                  variant="destructive"
                  onClick={async () => {
                    try {
                      await deleteMutation.mutateAsync(data.id)
                      toast.success('Listing removed.')
                      setRemoveOpen(false)
                      navigate('/apartments')
                    } catch (e) {
                      toast.error(
                        e instanceof Error
                          ? e.message
                          : 'Could not remove listing.'
                      )
                    }
                  }}
                >
                  {deleteMutation.isPending ? 'Removing…' : 'Remove'}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

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
