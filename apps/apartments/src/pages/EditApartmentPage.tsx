import { ChevronLeft } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { useI18n } from '@/contexts/I18nContext'
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
  const { t } = useI18n()
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
      <PageHeader
        title={t('editApartment.title')}
        description={t('editApartment.description')}
      />

      {isPending ? <LoadingState label={t('editApartment.loading')} /> : null}
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
                    toast.success(t('editApartment.updated'))
                    navigate(`/apartments/${data.id}`)
                  } catch (e) {
                    toast.error(
                      e instanceof Error
                        ? e.message
                        : t('editApartment.saveFailed')
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
                {t('editApartment.remove')}
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
                <AlertDialogTitle>
                  {t('editApartment.removeTitle')}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {t('editApartment.removeDescription')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleteMutation.isPending}>
                  {t('common.cancel')}
                </AlertDialogCancel>
                <Button
                  className="min-h-11 sm:min-w-32"
                  disabled={deleteMutation.isPending}
                  variant="destructive"
                  onClick={async () => {
                    try {
                      await deleteMutation.mutateAsync(data.id)
                      toast.success(t('editApartment.removed'))
                      setRemoveOpen(false)
                      navigate('/apartments')
                    } catch (e) {
                      toast.error(
                        e instanceof Error
                          ? e.message
                          : t('editApartment.removeFailed')
                      )
                    }
                  }}
                >
                  {deleteMutation.isPending
                    ? t('common.removing')
                    : t('common.delete')}
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
                {t('common.back')}
              </Link>
            </Button>
            <Button
              className="min-h-11 inline-flex flex-1 items-center justify-center gap-1"
              disabled={updateMutation.isPending}
              form="apartment-form"
              type="submit"
            >
              {t('editApartment.saveChanges')}
            </Button>
          </PinnedActionBar>
        </>
      ) : null}
    </section>
  )
}
