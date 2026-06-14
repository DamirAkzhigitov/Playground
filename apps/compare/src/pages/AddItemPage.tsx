import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'

import { AnswerField } from '@/components/AnswerField'
import { LoadingState } from '@/components/LoadingState'
import { PageHeader } from '@/components/PageHeader'
import { PinnedActionBar } from '@/components/layout/PinnedActionBar'
import { Button } from '@/components/ui/button'
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
import { Textarea } from '@/components/ui/textarea'
import { useI18n } from '@/contexts/I18nContext'
import {
  useCreateItem,
  useCreateItemType,
  useItemTypeTemplate,
  useItemTypes,
  useUpsertAnswer
} from '@/hooks'
import { flattenActiveSpecs } from '@/lib/specs'

type SpecDraft = { value: string | null; note: string | null }

const baseSchema = z.object({
  title: z.string().trim().min(1).max(200),
  itemTypeId: z.string().min(1),
  notes: z.string().max(5000).optional(),
  isPublic: z.boolean()
})

export function AddItemPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { data: types, isPending: typesLoading } = useItemTypes()
  const createItem = useCreateItem()
  const createType = useCreateItemType()
  const upsertAnswer = useUpsertAnswer()

  const form = useForm({
    resolver: zodResolver(baseSchema),
    defaultValues: {
      title: '',
      itemTypeId: '',
      notes: '',
      isPublic: false
    }
  })

  const itemTypeId = useWatch({ control: form.control, name: 'itemTypeId' })
  const { data: template, isPending: templateLoading } = useItemTypeTemplate(
    itemTypeId || undefined
  )

  const flatSpecs = useMemo(
    () => (template ? flattenActiveSpecs(template) : []),
    [template]
  )

  const [specEdits, setSpecEdits] = useState<Record<string, SpecDraft>>({})

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const item = await createItem.mutateAsync({
        title: values.title,
        itemTypeId: values.itemTypeId,
        notes: values.notes?.trim() || null,
        isPublic: values.isPublic
      })

      const answers = flatSpecs
        .map((spec) => ({
          itemId: item.id,
          specId: spec.id,
          value: specEdits[spec.id]?.value ?? null,
          note: specEdits[spec.id]?.note ?? null
        }))
        .filter((a) => a.value !== null || a.note !== null)

      if (answers.length > 0) {
        await upsertAnswer.mutateAsync({ answers })
      }

      toast.success(t('addItem.created'))
      navigate(`/items/${item.id}`)
    } catch {
      toast.error(t('addItem.createFailed'))
    }
  })

  const handleCreateType = async () => {
    const name = window.prompt(t('addItem.newTypePrompt'))
    if (!name?.trim()) return
    try {
      const created = await createType.mutateAsync({ name: name.trim() })
      form.setValue('itemTypeId', created.id)
      toast.success(t('addItem.typeCreated'))
      navigate(`/item-types/${created.id}/specs`)
    } catch {
      toast.error(t('addItem.typeCreateFailed'))
    }
  }

  if (typesLoading) {
    return <LoadingState label={t('addItem.loading')} />
  }

  return (
    <section className="pb-page-pinned space-y-6">
      <PageHeader
        title={t('addItem.title')}
        description={t('addItem.description')}
      />

      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('itemForm.title')}</FormLabel>
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
                  onValueChange={(value) => {
                    field.onChange(value)
                    setSpecEdits({})
                  }}
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
                        {!type.isSystem ? ` (${t('itemForm.custom')})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="link"
                  className="h-auto px-0"
                  onClick={handleCreateType}
                >
                  {t('addItem.createType')}
                </Button>
                <FormMessage />
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
                <div>
                  <FormLabel>{t('itemForm.public')}</FormLabel>
                  <p className="text-xs text-muted-foreground">
                    {t('itemForm.publicHelp')}
                  </p>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {itemTypeId ? (
            templateLoading ? (
              <LoadingState label={t('addItem.loadingSpecs')} />
            ) : flatSpecs.length > 0 ? (
              <div className="space-y-4">
                <h2 className="text-sm font-semibold">{t('addItem.specs')}</h2>
                {flatSpecs.map((spec) => (
                  <AnswerField
                    key={spec.id}
                    question={spec}
                    value={specEdits[spec.id]?.value ?? null}
                    note={specEdits[spec.id]?.note ?? null}
                    onValueChange={(value) =>
                      setSpecEdits((prev) => ({
                        ...prev,
                        [spec.id]: {
                          ...prev[spec.id],
                          value,
                          note: prev[spec.id]?.note ?? null
                        }
                      }))
                    }
                    onNoteChange={(note) =>
                      setSpecEdits((prev) => ({
                        ...prev,
                        [spec.id]: { value: prev[spec.id]?.value ?? null, note }
                      }))
                    }
                    noteExpanded={Boolean(specEdits[spec.id]?.note)}
                    onToggleNote={() =>
                      setSpecEdits((prev) => ({
                        ...prev,
                        [spec.id]: {
                          value: prev[spec.id]?.value ?? null,
                          note: prev[spec.id]?.note ? null : ''
                        }
                      }))
                    }
                    density="compact"
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t('addItem.noSpecs')}
              </p>
            )
          ) : null}

          <PinnedActionBar>
            <Button
              type="submit"
              className="min-h-11 w-full"
              disabled={createItem.isPending}
            >
              {t('addItem.submit')}
            </Button>
          </PinnedActionBar>
        </form>
      </Form>
    </section>
  )
}
