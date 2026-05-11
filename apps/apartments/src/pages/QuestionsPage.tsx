import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArchiveRestore,
  ArchiveX,
  ChevronDown,
  ChevronUp,
  GripVertical,
  MoreVertical,
  Pencil,
  Plus,
  Trash2
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { useI18n } from '@/contexts/I18nContext'
import { ErrorState } from '@/components/ErrorState'
import { LoadingState } from '@/components/LoadingState'
import { PinnedActionBar } from '@/components/layout/PinnedActionBar'
import { PageHeader } from '@/components/PageHeader'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet'
import {
  useCategories,
  useCreateCategory,
  useCreateQuestion,
  useDeleteCategory,
  useQuestions,
  useReorderQuestions,
  useUpdateCategory,
  useUpdateQuestion
} from '@/hooks'
import type { MessageId } from '@/i18n/messages'
import type { Question } from '@/types'
import { QUESTION_TYPE_ORDER } from '@/lib/questionTypes'
import { questionTypeMessageId } from '@/lib/questionTypeMessageId'

function buildQuestionFormSchema(t: (id: MessageId) => string) {
  return z
    .object({
      label: z.string().trim().min(1, t('questions.valLabel')),
      type: z.enum([
        'text',
        'number',
        'date',
        'boolean',
        'select',
        'multi-select',
        'rating'
      ]),
      categoryId: z.string().min(1, t('questions.valCategory')),
      required: z.boolean(),
      order: z.coerce.number().int().nonnegative(),
      ratingMin: z.coerce.number().int().min(1),
      ratingMax: z.coerce.number().int().min(1),
      options: z.array(
        z.object({
          label: z.string(),
          value: z.string()
        })
      )
    })
    .refine(
      (data) => data.type !== 'rating' || data.ratingMax >= data.ratingMin,
      { message: t('questions.valRating'), path: ['ratingMax'] }
    )
}

type QuestionFormValues = z.input<ReturnType<typeof buildQuestionFormSchema>>

const buildDefaults = (
  categoryId: string,
  question?: Question
): QuestionFormValues => ({
  label: question?.label ?? '',
  type: question?.type ?? 'text',
  categoryId: question?.categoryId ?? categoryId,
  required: question?.required ?? false,
  order: question?.order ?? 1,
  ratingMin: question?.ratingMin ?? 1,
  ratingMax: question?.ratingMax ?? 5,
  options:
    question?.options.map((option) => ({
      label: option.label,
      value: option.value
    })) ?? []
})

export function QuestionsPage() {
  const { t } = useI18n()
  const questionFormSchema = useMemo(() => buildQuestionFormSchema(t), [t])
  const questionResolver = useMemo(
    () => zodResolver(questionFormSchema),
    [questionFormSchema]
  )

  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(
    null
  )
  const [newCategoryName, setNewCategoryName] = useState('')
  const [categoryRenames, setCategoryRenames] = useState<
    Record<string, string>
  >({})
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null)

  const questionsQuery = useQuestions({ includeArchived: true })
  const categoriesQuery = useCategories()
  const createQuestion = useCreateQuestion()
  const updateQuestion = useUpdateQuestion()
  const reorderQuestions = useReorderQuestions()
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  const deleteCategory = useDeleteCategory()

  const categories = useMemo(
    () => categoriesQuery.data ?? [],
    [categoriesQuery.data]
  )
  const groups = useMemo(() => questionsQuery.data ?? [], [questionsQuery.data])
  const allQuestions = useMemo(
    () => groups.flatMap((group) => group.questions),
    [groups]
  )

  const activeCategories = useMemo(
    () =>
      categories
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((category) => ({
          ...category,
          activeQuestions: allQuestions
            .filter((question) => question.categoryId === category.id)
            .filter((question) => !question.isArchived)
            .sort((a, b) => a.order - b.order),
          archivedQuestions: allQuestions
            .filter((question) => question.categoryId === category.id)
            .filter((question) => question.isArchived)
            .sort((a, b) => a.order - b.order)
        })),
    [allQuestions, categories]
  )

  const editingQuestion =
    editingQuestionId === 'new' || editingQuestionId === null
      ? undefined
      : allQuestions.find((question) => question.id === editingQuestionId)
  const defaultCategoryId = categories[0]?.id ?? ''

  const form = useForm<QuestionFormValues>({
    resolver: questionResolver,
    defaultValues: buildDefaults(defaultCategoryId, editingQuestion)
  })
  const selectedType = useWatch({
    control: form.control,
    name: 'type'
  })
  const optionsArray = useFieldArray({
    control: form.control,
    name: 'options'
  })

  const isLoading = questionsQuery.isPending || categoriesQuery.isPending
  const hasError = questionsQuery.isError || categoriesQuery.isError
  const errorMessage =
    questionsQuery.error?.message ?? categoriesQuery.error?.message

  const startCreate = () => {
    setEditingQuestionId('new')
    form.reset(buildDefaults(defaultCategoryId))
  }

  const startEdit = (question: Question) => {
    setEditingQuestionId(question.id)
    form.reset(buildDefaults(defaultCategoryId, question))
  }

  const stopEdit = () => {
    setEditingQuestionId(null)
    form.reset(buildDefaults(defaultCategoryId))
  }

  useEffect(() => {
    if (editingQuestionId) {
      form.reset(buildDefaults(defaultCategoryId, editingQuestion))
    }
  }, [defaultCategoryId, editingQuestion, editingQuestionId, form])

  const moveQuestion = async (
    categoryId: string,
    questionId: string,
    direction: -1 | 1
  ) => {
    const categoryQuestions = allQuestions
      .filter((question) => question.categoryId === categoryId)
      .filter((question) => !question.isArchived)
      .sort((a, b) => a.order - b.order)
    const currentIndex = categoryQuestions.findIndex(
      (question) => question.id === questionId
    )
    const nextIndex = currentIndex + direction
    if (
      currentIndex < 0 ||
      nextIndex < 0 ||
      nextIndex >= categoryQuestions.length
    ) {
      return
    }

    const reordered = categoryQuestions.slice()
    const [item] = reordered.splice(currentIndex, 1)
    if (!item) {
      return
    }
    reordered.splice(nextIndex, 0, item)

    try {
      await reorderQuestions.mutateAsync(
        reordered.map((question, index) => ({
          id: question.id,
          order: index + 1
        }))
      )
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t('questions.toastReorder')
      )
    }
  }

  const moveCategory = async (categoryId: string, direction: -1 | 1) => {
    const ordered = categories.slice().sort((a, b) => a.order - b.order)
    const currentIndex = ordered.findIndex(
      (category) => category.id === categoryId
    )
    const nextIndex = currentIndex + direction
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= ordered.length) {
      return
    }
    const current = ordered[currentIndex]
    const next = ordered[nextIndex]
    if (!current || !next) {
      return
    }
    try {
      await updateCategory.mutateAsync({
        id: current.id,
        payload: { order: next.order }
      })
      await updateCategory.mutateAsync({
        id: next.id,
        payload: { order: current.order }
      })
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t('questions.toastReorder')
      )
    }
  }

  const onSubmit = form.handleSubmit(async (values) => {
    const payload = {
      label: values.label.trim(),
      type: values.type,
      categoryId: values.categoryId,
      required: values.required,
      order: Number(values.order),
      ratingMin: values.type === 'rating' ? Number(values.ratingMin) : null,
      ratingMax: values.type === 'rating' ? Number(values.ratingMax) : null,
      options:
        values.type === 'select' || values.type === 'multi-select'
          ? values.options
              .filter(
                (option) =>
                  option.label.trim().length > 0 &&
                  option.value.trim().length > 0
              )
              .map((option, index) => ({
                label: option.label.trim(),
                value: option.value.trim(),
                order: index + 1
              }))
          : []
    }

    try {
      if (editingQuestionId === 'new') {
        await createQuestion.mutateAsync(payload)
        toast.success(t('questions.toastCreated'))
      } else if (editingQuestionId) {
        await updateQuestion.mutateAsync({
          id: editingQuestionId,
          payload
        })
        toast.success(t('questions.toastSaved'))
      }
      stopEdit()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t('questions.toastSaveFailed')
      )
    }
  })

  const handleRenameCategory = async (categoryId: string) => {
    const name = (
      categoryRenames[categoryId] ??
      categories.find((c) => c.id === categoryId)?.name ??
      ''
    ).trim()
    if (!name) {
      return
    }
    try {
      await updateCategory.mutateAsync({
        id: categoryId,
        payload: { name }
      })
      toast.success(t('questions.toastRenamed'))
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t('questions.toastRenameFailed')
      )
    }
  }

  const handleAddCategory = async () => {
    const name = newCategoryName.trim()
    if (!name) {
      return
    }
    try {
      await createCategory.mutateAsync({ name })
      setNewCategoryName('')
      toast.success(t('questions.toastAdded'))
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t('questions.toastAddFailed')
      )
    }
  }

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) {
      return
    }
    try {
      await deleteCategory.mutateAsync(categoryToDelete)
      toast.success(t('questions.toastDeleted'))
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t('questions.toastDeleteFailed')
      )
    } finally {
      setCategoryToDelete(null)
    }
  }

  const handleToggleArchive = async (question: Question) => {
    try {
      await updateQuestion.mutateAsync({
        id: question.id,
        payload: { isArchived: !question.isArchived }
      })
      toast.success(
        question.isArchived
          ? t('questions.toastRestored')
          : t('questions.toastArchived')
      )
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t('questions.toastArchiveFailed')
      )
    }
  }

  const isEditorOpen = editingQuestionId !== null
  const editorTitle =
    editingQuestionId === 'new'
      ? t('questions.editorCreate')
      : t('questions.editorEdit')
  const showQuestionsToolbar = !isLoading && !hasError && !isEditorOpen

  return (
    <section
      className={cn('space-y-6', showQuestionsToolbar && 'pb-page-pinned')}
    >
      <PageHeader
        title={t('questions.pageTitle')}
        description={t('questions.pageDescription')}
      />

      {isLoading ? <LoadingState label={t('questions.loading')} /> : null}
      {hasError && errorMessage ? <ErrorState message={errorMessage} /> : null}

      {!isLoading && !hasError ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{t('questions.categories')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  aria-label={t('questions.newCategoryAria')}
                  className="sm:flex-1"
                  onChange={(event) => setNewCategoryName(event.target.value)}
                  placeholder={t('questions.newCategoryPh')}
                  value={newCategoryName}
                />
                <Button
                  disabled={!newCategoryName.trim() || createCategory.isPending}
                  onClick={handleAddCategory}
                  type="button"
                  variant="outline"
                >
                  {t('questions.add')}
                </Button>
              </div>

              <ul className="space-y-2">
                {activeCategories.map((category, index) => (
                  <li
                    key={category.id}
                    className="rounded-md border border-border bg-background p-3"
                  >
                    <div className="flex flex-row items-center gap-2">
                      <Input
                        aria-label={t('questions.renameAria', {
                          name: category.name
                        })}
                        className="min-w-0 flex-1"
                        onChange={(event) =>
                          setCategoryRenames((prev) => ({
                            ...prev,
                            [category.id]: event.target.value
                          }))
                        }
                        value={categoryRenames[category.id] ?? category.name}
                      />
                      <div className="ml-auto flex shrink-0 items-center gap-2">
                        <Button
                          disabled={updateCategory.isPending}
                          onClick={() => handleRenameCategory(category.id)}
                          size="sm"
                          type="button"
                          variant="outline"
                        >
                          {t('common.save')}
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              aria-label={t('questions.moreActionsC', {
                                name: category.name
                              })}
                              size="icon-lg"
                              type="button"
                              variant="ghost"
                            >
                              <MoreVertical aria-hidden="true" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              disabled={index === 0}
                              onSelect={() => moveCategory(category.id, -1)}
                            >
                              <ChevronUp aria-hidden="true" />
                              {t('common.moveUp')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={index === activeCategories.length - 1}
                              onSelect={() => moveCategory(category.id, 1)}
                            >
                              <ChevronDown aria-hidden="true" />
                              {t('common.moveDown')}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onSelect={() => setCategoryToDelete(category.id)}
                              variant="destructive"
                            >
                              <Trash2 aria-hidden="true" />
                              {t('common.delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </li>
                ))}
                {activeCategories.length === 0 ? (
                  <li className="rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground">
                    {t('questions.noCategories')}
                  </li>
                ) : null}
              </ul>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {activeCategories.map((category) => (
              <Card key={category.id}>
                <CardHeader>
                  <CardTitle>{category.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      {t('questions.active')}
                    </h3>
                    <ul className="mt-2 space-y-2">
                      {category.activeQuestions.map((question) => (
                        <li
                          key={question.id}
                          className="rounded-md border border-border bg-background p-3"
                        >
                          <QuestionRow
                            canMoveDown={
                              category.activeQuestions.indexOf(question) <
                              category.activeQuestions.length - 1
                            }
                            canMoveUp={
                              category.activeQuestions.indexOf(question) > 0
                            }
                            onArchiveToggle={() =>
                              handleToggleArchive(question)
                            }
                            onEdit={() => startEdit(question)}
                            onMove={(direction) =>
                              moveQuestion(category.id, question.id, direction)
                            }
                            question={question}
                          />
                        </li>
                      ))}
                      {category.activeQuestions.length === 0 ? (
                        <li className="rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground">
                          {t('questions.noActiveInCategory')}
                        </li>
                      ) : null}
                    </ul>
                  </div>

                  {category.archivedQuestions.length > 0 ? (
                    <>
                      <Separator />
                      <div>
                        <h3 className="text-sm font-semibold text-muted-foreground">
                          {t('questions.archived')}
                        </h3>
                        <ul className="mt-2 space-y-2">
                          {category.archivedQuestions.map((question) => (
                            <li
                              key={question.id}
                              className="rounded-md border border-border bg-muted/40 p-3 text-muted-foreground"
                            >
                              <QuestionRow
                                archived
                                onArchiveToggle={() =>
                                  handleToggleArchive(question)
                                }
                                onEdit={() => startEdit(question)}
                                question={question}
                              />
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : null}

      {showQuestionsToolbar ? (
        <PinnedActionBar>
          <Button
            className="min-h-11 inline-flex flex-1 items-center justify-center gap-1"
            onClick={startCreate}
            type="button"
          >
            <Plus aria-hidden="true" className="size-4 shrink-0" />
            {t('questions.newQuestion')}
          </Button>
        </PinnedActionBar>
      ) : null}

      <Sheet
        onOpenChange={(open) => {
          if (!open) {
            stopEdit()
          }
        }}
        open={isEditorOpen}
      >
        <SheetContent
          className="flex max-h-[90dvh] w-full flex-col overflow-hidden sm:max-w-lg"
          side="bottom"
        >
          <SheetHeader>
            <SheetTitle>{editorTitle}</SheetTitle>
            <SheetDescription>{t('questions.editorDesc')}</SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <Form {...form}>
              <form
                className="space-y-4 px-4 pb-4"
                id="question-form"
                onSubmit={onSubmit}
              >
                <FormField
                  control={form.control}
                  name="label"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('questions.label')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('questions.labelPh')}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('questions.type')}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue
                                placeholder={t('questions.pickType')}
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {QUESTION_TYPE_ORDER.map((type) => (
                              <SelectItem key={type} value={type}>
                                {t(questionTypeMessageId(type))}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('questions.category')}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue
                                placeholder={t('questions.pickCategory')}
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="order"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('questions.order')}</FormLabel>
                        <FormControl>
                          <Input
                            min={0}
                            name={field.name}
                            onBlur={field.onBlur}
                            onChange={(event) =>
                              field.onChange(event.target.value)
                            }
                            ref={field.ref}
                            type="number"
                            value={String(field.value ?? '')}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="required"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center gap-3 pt-6">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="!mt-0">
                          {t('questions.requiredField')}
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                </div>

                {selectedType === 'rating' ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="ratingMin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('questions.ratingMin')}</FormLabel>
                          <FormControl>
                            <Input
                              min={1}
                              name={field.name}
                              onBlur={field.onBlur}
                              onChange={(event) =>
                                field.onChange(event.target.value)
                              }
                              ref={field.ref}
                              type="number"
                              value={String(field.value ?? '')}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="ratingMax"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('questions.ratingMax')}</FormLabel>
                          <FormControl>
                            <Input
                              min={1}
                              name={field.name}
                              onBlur={field.onBlur}
                              onChange={(event) =>
                                field.onChange(event.target.value)
                              }
                              ref={field.ref}
                              type="number"
                              value={String(field.value ?? '')}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ) : null}

                {selectedType === 'select' ||
                selectedType === 'multi-select' ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-foreground">
                        {t('questions.optionsTitle')}
                      </h3>
                      <Button
                        onClick={() =>
                          optionsArray.append({ label: '', value: '' })
                        }
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        <Plus aria-hidden="true" />
                        {t('questions.addOption')}
                      </Button>
                    </div>
                    <ul className="space-y-2">
                      {optionsArray.fields.map((field, index) => (
                        <li
                          key={field.id}
                          className="rounded-md border border-border bg-background p-3"
                        >
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <FormField
                              control={form.control}
                              name={`options.${index}.label`}
                              render={({ field: innerField }) => (
                                <FormItem>
                                  <FormLabel className="text-xs">
                                    {t('questions.optionLabel')}
                                  </FormLabel>
                                  <FormControl>
                                    <Input {...innerField} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`options.${index}.value`}
                              render={({ field: innerField }) => (
                                <FormItem>
                                  <FormLabel className="text-xs">
                                    {t('questions.optionValue')}
                                  </FormLabel>
                                  <FormControl>
                                    <Input {...innerField} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <GripVertical
                                aria-hidden="true"
                                className="size-3.5"
                              />
                              <span>#{index + 1}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                aria-label={t('questions.moveOptionUp')}
                                disabled={index === 0}
                                onClick={() =>
                                  optionsArray.swap(index, index - 1)
                                }
                                size="icon-sm"
                                type="button"
                                variant="ghost"
                              >
                                <ChevronUp aria-hidden="true" />
                              </Button>
                              <Button
                                aria-label={t('questions.moveOptionDown')}
                                disabled={
                                  index === optionsArray.fields.length - 1
                                }
                                onClick={() =>
                                  optionsArray.swap(index, index + 1)
                                }
                                size="icon-sm"
                                type="button"
                                variant="ghost"
                              >
                                <ChevronDown aria-hidden="true" />
                              </Button>
                              <Button
                                aria-label={t('questions.removeOption')}
                                onClick={() => optionsArray.remove(index)}
                                size="icon-sm"
                                type="button"
                                variant="ghost"
                              >
                                <Trash2 aria-hidden="true" />
                              </Button>
                            </div>
                          </div>
                        </li>
                      ))}
                      {optionsArray.fields.length === 0 ? (
                        <li className="rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground">
                          {t('questions.needOneOption')}
                        </li>
                      ) : null}
                    </ul>
                  </div>
                ) : null}
              </form>
            </Form>
          </div>
          <SheetFooter className="flex-row justify-end gap-2 border-t">
            <Button onClick={stopEdit} type="button" variant="outline">
              {t('common.cancel')}
            </Button>
            <Button
              disabled={createQuestion.isPending || updateQuestion.isPending}
              form="question-form"
              type="submit"
            >
              {t('common.save')}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog
        onOpenChange={(open) => {
          if (!open) {
            setCategoryToDelete(null)
          }
        }}
        open={categoryToDelete !== null}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('questions.deleteCategoryTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('questions.deleteCategoryDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={handleDeleteCategory}
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}

type QuestionRowProps = {
  question: Question
  archived?: boolean
  canMoveUp?: boolean
  canMoveDown?: boolean
  onEdit: () => void
  onArchiveToggle: () => void
  onMove?: (direction: -1 | 1) => void
}

function QuestionRow({
  archived = false,
  canMoveDown = false,
  canMoveUp = false,
  onArchiveToggle,
  onEdit,
  onMove,
  question
}: QuestionRowProps) {
  const { t } = useI18n()
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground">{question.label}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary">
            {t(questionTypeMessageId(question.type))}
          </Badge>
          <span>
            {question.required ? t('common.required') : t('common.optional')}
          </span>
          <span aria-hidden="true">·</span>
          <span>{t('questions.orderLabel', { n: question.order })}</span>
          {archived ? (
            <Badge variant="outline">{t('common.archived')}</Badge>
          ) : null}
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            aria-label={t('questions.moreActionsQ')}
            size="icon-lg"
            type="button"
            variant="ghost"
          >
            <MoreVertical aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={onEdit}>
            <Pencil aria-hidden="true" />
            {t('common.edit')}
          </DropdownMenuItem>
          {!archived && onMove ? (
            <>
              <DropdownMenuItem
                disabled={!canMoveUp}
                onSelect={() => onMove(-1)}
              >
                <ChevronUp aria-hidden="true" />
                {t('common.moveUp')}
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!canMoveDown}
                onSelect={() => onMove(1)}
              >
                <ChevronDown aria-hidden="true" />
                {t('common.moveDown')}
              </DropdownMenuItem>
            </>
          ) : null}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={onArchiveToggle}>
            {archived ? (
              <>
                <ArchiveRestore aria-hidden="true" />
                {t('common.unarchive')}
              </>
            ) : (
              <>
                <ArchiveX aria-hidden="true" />
                {t('common.archive')}
              </>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
