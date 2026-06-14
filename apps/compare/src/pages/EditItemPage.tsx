import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'

import { ErrorState } from '@/components/ErrorState'
import { LoadingState } from '@/components/LoadingState'
import { PageHeader } from '@/components/PageHeader'
import { PinnedActionBar } from '@/components/layout/PinnedActionBar'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useI18n } from '@/contexts/I18nContext'
import { useDeleteItem, useItem, useUpdateItem } from '@/hooks'

const schema = z.object({
  title: z.string().trim().min(1).max(200),
  notes: z.string().max(5000).optional(),
  isPublic: z.boolean()
})

export function EditItemPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useI18n()
  const navigate = useNavigate()
  const { data, isPending, isError, error } = useItem(id)
  const updateItem = useUpdateItem()
  const deleteItem = useDeleteItem()

  const form = useForm({
    resolver: zodResolver(schema),
    values: data
      ? {
          title: data.title,
          notes: data.notes ?? '',
          isPublic: data.isPublic
        }
      : undefined
  })

  if (isPending) return <LoadingState label={t('itemDetail.loading')} />
  if (isError) return <ErrorState message={error.message} />
  if (!data || !data.isOwner)
    return <ErrorState message={t('errors.notFound')} />

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await updateItem.mutateAsync({
        id: data.id,
        payload: {
          title: values.title,
          notes: values.notes?.trim() || null,
          isPublic: values.isPublic
        }
      })
      toast.success(t('itemEdit.updated'))
      navigate(`/items/${data.id}`)
    } catch {
      toast.error(t('itemEdit.saveFailed'))
    }
  })

  const handleDelete = async () => {
    if (!window.confirm(t('itemEdit.deleteConfirm'))) return
    try {
      await deleteItem.mutateAsync(data.id)
      toast.success(t('itemEdit.deleted'))
      navigate('/items')
    } catch {
      toast.error(t('itemEdit.deleteFailed'))
    }
  }

  return (
    <section className="pb-page-pinned space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to={`/items/${data.id}`}>{t('common.back')}</Link>
      </Button>
      <PageHeader title={t('itemEdit.title')} />

      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('itemForm.title')}</FormLabel>
                <FormControl>
                  <Input {...field} className="min-h-11" />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('itemForm.notes')}</FormLabel>
                <FormControl>
                  <Textarea {...field} rows={3} className="resize-none" />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="isPublic"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-xl border p-4">
                <FormLabel>{t('itemForm.public')}</FormLabel>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <PinnedActionBar>
            <div className="flex w-full flex-col gap-2">
              <Button type="submit" className="min-h-11 w-full">
                {t('common.save')}
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="min-h-11 w-full"
                onClick={handleDelete}
              >
                {t('itemEdit.delete')}
              </Button>
            </div>
          </PinnedActionBar>
        </form>
      </Form>
    </section>
  )
}
