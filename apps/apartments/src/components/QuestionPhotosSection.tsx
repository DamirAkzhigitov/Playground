import {
  Camera,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Trash2
} from 'lucide-react'
import { useCallback, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { toast } from 'sonner'

import { useI18n } from '@/contexts/I18nContext'

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle
} from '@/components/ui/dialog'
import { useDeletePhoto, useUploadPhoto } from '@/hooks'
import { compressImageForUpload } from '@/lib/compressImage'
import { photoPublicUrl } from '@/lib/photoUrl'
import { cn } from '@/lib/utils'
import type { Photo } from '@/types'

type QuestionPhotosSectionProps = {
  apartmentId: string
  questionId: string
  questionLabel: string
  allPhotos: Photo[]
  density?: 'comfortable' | 'compact'
}

export function QuestionPhotosSection({
  apartmentId,
  questionId,
  questionLabel,
  allPhotos,
  density = 'comfortable'
}: QuestionPhotosSectionProps) {
  const { t } = useI18n()
  const photos = useMemo(
    () =>
      allPhotos
        .filter((p) => p.questionId === questionId)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
    [allPhotos, questionId]
  )

  const cameraInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const upload = useUploadPhoto()
  const del = useDeletePhoto()

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Photo | null>(null)

  const lightboxPhoto =
    lightboxIndex !== null ? (photos[lightboxIndex] ?? null) : null

  const runUpload = useCallback(
    async (file: File | undefined) => {
      if (!file) {
        return
      }
      try {
        const prepared = await compressImageForUpload(file)
        await upload.mutateAsync({
          apartmentId,
          questionId,
          file: prepared
        })
        toast.success(t('photos.added'))
      } catch (e) {
        toast.error(e instanceof Error ? e.message : t('photos.uploadFailed'))
      }
    },
    [apartmentId, questionId, upload, t]
  )

  const onFileInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      void runUpload(file)
      e.target.value = ''
    },
    [runUpload]
  )

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) {
      return
    }
    const targetId = deleteTarget.id
    const snapshot = photos
    const deletedIndex = snapshot.findIndex((p) => p.id === targetId)
    try {
      await del.mutateAsync({ id: targetId, apartmentId })
      toast.success(t('photos.removed'))
      setDeleteTarget(null)
      setLightboxIndex((current) => {
        if (current === null) {
          return null
        }
        if (snapshot.length <= 1) {
          return null
        }
        if (deletedIndex < 0) {
          return null
        }
        if (deletedIndex < current) {
          return current - 1
        }
        if (deletedIndex === current) {
          if (deletedIndex === snapshot.length - 1) {
            return Math.max(0, current - 1)
          }
          return current
        }
        return current
      })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('photos.deleteFailed'))
    }
  }, [apartmentId, del, deleteTarget, photos, t])

  const openLightbox = (index: number) => setLightboxIndex(index)
  const closeLightbox = () => setLightboxIndex(null)

  const goPrevLightbox = () => {
    setLightboxIndex((i) => (i === null || i <= 0 ? i : i - 1))
  }

  const goNextLightbox = () => {
    setLightboxIndex((i) => (i === null || i >= photos.length - 1 ? i : i + 1))
  }

  const busy = upload.isPending || del.isPending
  const compact = density === 'compact'

  return (
    <div className={cn('space-y-3', compact ? 'pt-1' : 'pt-2')}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            aria-hidden
            tabIndex={-1}
            onChange={onFileInputChange}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            aria-hidden
            tabIndex={-1}
            onChange={onFileInputChange}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-11 gap-2"
            disabled={busy}
            onClick={() => cameraInputRef.current?.click()}
          >
            <Camera className="size-4 shrink-0" aria-hidden />
            <span>{t('photos.takePhoto')}</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-11 gap-2"
            disabled={busy}
            onClick={() => fileInputRef.current?.click()}
          >
            <ImagePlus className="size-4 shrink-0" aria-hidden />
            <span>{t('photos.addFromLibrary')}</span>
          </Button>
        </div>
      </div>

      {photos.length > 0 && (
        <ul
          className={cn(
            'grid gap-2',
            compact
              ? 'grid-cols-3 sm:grid-cols-4'
              : 'grid-cols-2 sm:grid-cols-3'
          )}
        >
          {photos.map((photo, index) => (
            <li key={photo.id} className="relative aspect-square">
              <button
                type="button"
                className="relative size-full overflow-hidden rounded-xl border border-border bg-muted outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => openLightbox(index)}
                aria-label={t('photos.viewAria', {
                  index: index + 1,
                  total: photos.length,
                  label: questionLabel
                })}
              >
                <img
                  src={photoPublicUrl(photo.r2Key)}
                  alt=""
                  className="size-full object-cover"
                  loading="lazy"
                />
              </button>
              <Button
                type="button"
                variant="secondary"
                size="icon-lg"
                className="absolute right-1 bottom-1 size-11 rounded-full border border-border shadow-md"
                aria-label={t('photos.deleteAria')}
                disabled={busy}
                onClick={(e) => {
                  e.stopPropagation()
                  setDeleteTarget(photo)
                }}
              >
                <Trash2 className="size-4 text-destructive" aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={lightboxPhoto !== null}
        onOpenChange={(open) => {
          if (!open) {
            closeLightbox()
          }
        }}
      >
        <DialogContent
          showCloseButton
          className="max-h-[95dvh] w-[calc(100vw-1rem)] max-w-4xl gap-0 overflow-hidden border-0 bg-background/95 p-2 sm:p-4"
        >
          <DialogTitle className="sr-only">
            {t('photos.lightboxTitle', { label: questionLabel })}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t('photos.lightboxDesc')}
          </DialogDescription>
          {lightboxPhoto ? (
            <div className="relative flex max-h-[88dvh] items-center justify-center gap-2">
              {photos.length > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  size="icon-lg"
                  className="size-11 shrink-0"
                  aria-label={t('photos.prevAria')}
                  disabled={lightboxIndex === 0}
                  onClick={goPrevLightbox}
                >
                  <ChevronLeft className="size-5" aria-hidden />
                </Button>
              ) : null}
              <div className="min-h-0 min-w-0 flex-1">
                <img
                  src={photoPublicUrl(lightboxPhoto.r2Key)}
                  alt={t('photos.lightboxTitle', { label: questionLabel })}
                  className="mx-auto max-h-[min(80dvh,900px)] w-full object-contain"
                />
              </div>
              {photos.length > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  size="icon-lg"
                  className="size-11 shrink-0"
                  aria-label={t('photos.nextAria')}
                  disabled={lightboxIndex === photos.length - 1}
                  onClick={goNextLightbox}
                >
                  <ChevronRight className="size-5" aria-hidden />
                </Button>
              ) : null}
            </div>
          ) : null}
          {lightboxPhoto ? (
            <div className="flex justify-center border-t border-border pt-3">
              <Button
                type="button"
                variant="destructive"
                className="min-h-11"
                disabled={busy}
                onClick={() => {
                  setDeleteTarget(lightboxPhoto)
                }}
              >
                {t('photos.deleteThis')}
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !del.isPending) {
            setDeleteTarget(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('photos.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('photos.deleteDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={del.isPending}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <Button
              variant="destructive"
              className="min-h-11 sm:min-w-28"
              disabled={del.isPending}
              onClick={() => void confirmDelete()}
            >
              {del.isPending ? t('common.deleting') : t('common.delete')}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
