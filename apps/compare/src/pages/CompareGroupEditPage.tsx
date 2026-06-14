import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'

import { CompareMatrix } from '@/components/CompareMatrix'
import { LoadingState } from '@/components/LoadingState'
import { PageHeader } from '@/components/PageHeader'
import { PinnedActionBar } from '@/components/layout/PinnedActionBar'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useI18n } from '@/contexts/I18nContext'
import {
  useCompareGroupView,
  useCreateCompareGroup,
  useDeleteCompareGroup,
  useItemTypes,
  useItems,
  useSetCompareGroupItems,
  useUpdateCompareGroup
} from '@/hooks'

const schema = z.object({
  title: z.string().trim().min(1).max(200),
  itemTypeId: z.string().min(1),
  selectionMode: z.enum(['all', 'curated']),
  isPublic: z.boolean()
})

export function CompareGroupEditPage() {
  const { id } = useParams<{ id: string }>()
  const isNew = !id || id === 'new'
  const { t } = useI18n()
  const navigate = useNavigate()
  const { data: types } = useItemTypes()
  const createGroup = useCreateCompareGroup()
  const updateGroup = useUpdateCompareGroup()
  const deleteGroup = useDeleteCompareGroup()
  const setItems = useSetCompareGroupItems()
  const { data: view, isPending: viewLoading } = useCompareGroupView(
    isNew ? undefined : id
  )

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      itemTypeId: '',
      selectionMode: 'curated' as const,
      isPublic: false
    }
  })

  useEffect(() => {
    if (view?.group) {
      form.reset({
        title: view.group.title,
        itemTypeId: view.group.itemTypeId,
        selectionMode: view.group.selectionMode,
        isPublic: view.group.isPublic
      })
    }
  }, [view, form])

  const itemTypeId = useWatch({ control: form.control, name: 'itemTypeId' })
  const selectionMode = useWatch({
    control: form.control,
    name: 'selectionMode'
  })
  const { data: items } = useItems(itemTypeId || undefined)
  const ownItems = useMemo(
    () => (items ?? []).filter((item) => item.isOwner !== false),
    [items]
  )

  const viewItemIds = useMemo(
    () => view?.items?.map((item) => item.id) ?? [],
    [view?.items]
  )
  const [selectedItemIds, setSelectedItemIds] = useState<string[] | null>(null)
  const effectiveSelectedIds = selectedItemIds ?? viewItemIds

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (isNew) {
        const created = await createGroup.mutateAsync({
          title: values.title,
          itemTypeId: values.itemTypeId,
          selectionMode: values.selectionMode,
          isPublic: values.isPublic
        })
        if (values.selectionMode === 'curated') {
          await setItems.mutateAsync({
            id: created.id,
            itemIds: effectiveSelectedIds
          })
        }
        toast.success(t('myCompares.created'))
        navigate(`/my-compares/${created.id}`)
      } else if (id) {
        await updateGroup.mutateAsync({
          id,
          payload: {
            title: values.title,
            itemTypeId: values.itemTypeId,
            selectionMode: values.selectionMode,
            isPublic: values.isPublic
          }
        })
        if (values.selectionMode === 'curated') {
          await setItems.mutateAsync({ id, itemIds: effectiveSelectedIds })
        }
        toast.success(t('myCompares.updated'))
      }
    } catch {
      toast.error(t('myCompares.saveFailed'))
    }
  })

  const handleDelete = async () => {
    if (!id || isNew) return
    if (!window.confirm(t('myCompares.deleteConfirm'))) return
    try {
      await deleteGroup.mutateAsync(id)
      toast.success(t('myCompares.deleted'))
      navigate('/my-compares')
    } catch {
      toast.error(t('myCompares.deleteFailed'))
    }
  }

  if (!isNew && viewLoading) {
    return <LoadingState label={t('myCompares.loading')} />
  }

  return (
    <section className="pb-page-pinned space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/my-compares">{t('common.back')}</Link>
      </Button>

      <PageHeader
        title={isNew ? t('myCompares.newTitle') : t('myCompares.editTitle')}
      />

      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('myCompares.groupTitle')}</FormLabel>
                <FormControl>
                  <Input {...field} className="min-h-11" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="itemTypeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('itemForm.type')}</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={!isNew}
                >
                  <FormControl>
                    <SelectTrigger className="min-h-11">
                      <SelectValue
                        placeholder={t('itemForm.typePlaceholder')}
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(types ?? []).map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="selectionMode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('myCompares.selectionMode')}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="min-h-11">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="all">
                      {t('myCompares.modeAll')}
                    </SelectItem>
                    <SelectItem value="curated">
                      {t('myCompares.modeCurated')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isPublic"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-xl border p-4">
                <FormLabel>{t('myCompares.public')}</FormLabel>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {selectionMode === 'curated' && itemTypeId ? (
            <div className="space-y-2 rounded-xl border p-4">
              <p className="text-sm font-medium">{t('myCompares.pickItems')}</p>
              {ownItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t('myCompares.noItemsForType')}
                </p>
              ) : (
                ownItems.map((item) => (
                  <label
                    key={item.id}
                    className="flex min-h-11 cursor-pointer items-center gap-3"
                  >
                    <Checkbox
                      checked={effectiveSelectedIds.includes(item.id)}
                      onCheckedChange={(checked) => {
                        setSelectedItemIds((prev) => {
                          const current = prev ?? viewItemIds
                          return checked
                            ? [...current, item.id]
                            : current.filter((x) => x !== item.id)
                        })
                      }}
                    />
                    <span>{item.title}</span>
                  </label>
                ))
              )}
            </div>
          ) : null}

          {!isNew && view ? (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold">
                {t('myCompares.preview')}
              </h2>
              <CompareMatrix
                sections={view.sections}
                items={view.items}
                showPinnedBar={false}
              />
            </div>
          ) : null}

          <PinnedActionBar>
            <div className="flex w-full flex-col gap-2">
              <Button type="submit" className="min-h-11 w-full">
                {t('common.save')}
              </Button>
              {!isNew ? (
                <Button
                  type="button"
                  variant="destructive"
                  className="min-h-11 w-full"
                  onClick={handleDelete}
                >
                  {t('common.delete')}
                </Button>
              ) : null}
            </div>
          </PinnedActionBar>
        </form>
      </Form>
    </section>
  )
}
