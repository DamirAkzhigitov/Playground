import { useEffect, useMemo, useState } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'

import { ErrorState } from '../components/ErrorState'
import { LoadingState } from '../components/LoadingState'
import {
  useCategories,
  useCreateCategory,
  useCreateQuestion,
  useDeleteCategory,
  useQuestions,
  useReorderQuestions,
  useUpdateCategory,
  useUpdateQuestion
} from '../hooks'
import type { Question, QuestionType } from '../types'

const QUESTION_TYPES: QuestionType[] = [
  'text',
  'number',
  'boolean',
  'select',
  'multi-select',
  'rating'
]

type QuestionFormValues = {
  label: string
  type: QuestionType
  categoryId: string
  required: boolean
  order: number
  ratingMin: number
  ratingMax: number
  options: Array<{ label: string; value: string }>
}

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
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(
    null
  )
  const [newCategoryName, setNewCategoryName] = useState('')
  const [categoryRenames, setCategoryRenames] = useState<
    Record<string, string>
  >({})

  const questionsQuery = useQuestions(true)
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
    editingQuestionId === 'new'
      ? undefined
      : allQuestions.find((question) => question.id === editingQuestionId)
  const defaultCategoryId = categories[0]?.id ?? ''

  const form = useForm<QuestionFormValues>({
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

    await reorderQuestions.mutateAsync(
      reordered.map((question, index) => ({
        id: question.id,
        order: index + 1
      }))
    )
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
    await updateCategory.mutateAsync({
      id: current.id,
      payload: { order: next.order }
    })
    await updateCategory.mutateAsync({
      id: next.id,
      payload: { order: current.order }
    })
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

    if (editingQuestionId === 'new') {
      await createQuestion.mutateAsync(payload)
    } else if (editingQuestionId) {
      await updateQuestion.mutateAsync({
        id: editingQuestionId,
        payload
      })
    }

    stopEdit()
  })

  return (
    <section className="space-y-4">
      <header className="space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">
            Question Management
          </h1>
          <button
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white"
            onClick={startCreate}
            type="button"
          >
            New question
          </button>
        </div>
      </header>

      {isLoading ? <LoadingState label="Loading questions..." /> : null}
      {hasError && errorMessage ? <ErrorState message={errorMessage} /> : null}

      {!isLoading && !hasError ? (
        <>
          {editingQuestionId ? (
            <form
              className="space-y-3 rounded-lg border border-gray-200 bg-white p-4"
              onSubmit={onSubmit}
            >
              <h2 className="text-base font-semibold text-gray-900">
                {editingQuestionId === 'new'
                  ? 'Create question'
                  : 'Edit question'}
              </h2>
              <label className="block text-sm text-gray-700">
                Label
                <input
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                  {...form.register('label', { required: true })}
                />
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block text-sm text-gray-700">
                  Type
                  <select
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                    {...form.register('type')}
                  >
                    {QUESTION_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm text-gray-700">
                  Category
                  <select
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                    {...form.register('categoryId', { required: true })}
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block text-sm text-gray-700">
                  Order
                  <input
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                    min={0}
                    type="number"
                    {...form.register('order', { valueAsNumber: true })}
                  />
                </label>
                <label className="flex items-center gap-2 pt-7 text-sm text-gray-700">
                  <input
                    className="h-4 w-4 rounded border-gray-300"
                    type="checkbox"
                    {...form.register('required')}
                  />
                  Required
                </label>
              </div>

              {selectedType === 'rating' ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="block text-sm text-gray-700">
                    Rating min
                    <input
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                      min={1}
                      type="number"
                      {...form.register('ratingMin', { valueAsNumber: true })}
                    />
                  </label>
                  <label className="block text-sm text-gray-700">
                    Rating max
                    <input
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                      min={1}
                      type="number"
                      {...form.register('ratingMax', { valueAsNumber: true })}
                    />
                  </label>
                </div>
              ) : null}

              {selectedType === 'select' || selectedType === 'multi-select' ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900">
                      Options
                    </h3>
                    <button
                      className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700"
                      onClick={() =>
                        optionsArray.append({ label: '', value: '' })
                      }
                      type="button"
                    >
                      Add option
                    </button>
                  </div>
                  {optionsArray.fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="grid grid-cols-[1fr_1fr_auto] items-end gap-2"
                    >
                      <label className="block text-xs text-gray-700">
                        Label
                        <input
                          className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                          {...form.register(`options.${index}.label`)}
                        />
                      </label>
                      <label className="block text-xs text-gray-700">
                        Value
                        <input
                          className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                          {...form.register(`options.${index}.value`)}
                        />
                      </label>
                      <div className="flex gap-1 pb-1">
                        <button
                          className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 disabled:opacity-50"
                          disabled={index === 0}
                          onClick={() => optionsArray.swap(index, index - 1)}
                          type="button"
                        >
                          ↑
                        </button>
                        <button
                          className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 disabled:opacity-50"
                          disabled={index === optionsArray.fields.length - 1}
                          onClick={() => optionsArray.swap(index, index + 1)}
                          type="button"
                        >
                          ↓
                        </button>
                        <button
                          className="rounded border border-red-200 px-2 py-1 text-xs text-red-700"
                          onClick={() => optionsArray.remove(index)}
                          type="button"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="flex items-center gap-2">
                <button
                  className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                  disabled={
                    createQuestion.isPending || updateQuestion.isPending
                  }
                  type="submit"
                >
                  Save
                </button>
                <button
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700"
                  onClick={stopEdit}
                  type="button"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : null}

          <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="text-base font-semibold text-gray-900">
              Categories
            </h2>
            <div className="flex gap-2">
              <input
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                onChange={(event) => setNewCategoryName(event.target.value)}
                placeholder="New category name"
                value={newCategoryName}
              />
              <button
                className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 disabled:opacity-50"
                disabled={!newCategoryName.trim() || createCategory.isPending}
                onClick={async () => {
                  await createCategory.mutateAsync({
                    name: newCategoryName.trim()
                  })
                  setNewCategoryName('')
                }}
                type="button"
              >
                Add
              </button>
            </div>
            <ul className="space-y-2">
              {categories.map((category, index) => (
                <li
                  key={category.id}
                  className="flex items-center gap-2 rounded-md border border-gray-200 p-2"
                >
                  <input
                    className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                    onChange={(event) =>
                      setCategoryRenames((prev) => ({
                        ...prev,
                        [category.id]: event.target.value
                      }))
                    }
                    value={categoryRenames[category.id] ?? category.name}
                  />
                  <button
                    className="rounded border border-gray-300 px-2 py-1 text-xs disabled:opacity-50"
                    disabled={index === 0 || updateCategory.isPending}
                    onClick={() => moveCategory(category.id, -1)}
                    type="button"
                  >
                    ↑
                  </button>
                  <button
                    className="rounded border border-gray-300 px-2 py-1 text-xs disabled:opacity-50"
                    disabled={
                      index === categories.length - 1 ||
                      updateCategory.isPending
                    }
                    onClick={() => moveCategory(category.id, 1)}
                    type="button"
                  >
                    ↓
                  </button>
                  <button
                    className="rounded border border-gray-300 px-2 py-1 text-xs"
                    onClick={() =>
                      updateCategory.mutate({
                        id: category.id,
                        payload: {
                          name: (
                            categoryRenames[category.id] ?? category.name
                          ).trim()
                        }
                      })
                    }
                    type="button"
                  >
                    Rename
                  </button>
                  <button
                    className="rounded border border-red-200 px-2 py-1 text-xs text-red-700"
                    onClick={() => deleteCategory.mutate(category.id)}
                    type="button"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            {activeCategories.map((category) => (
              <article
                key={category.id}
                className="rounded-lg border border-gray-200 bg-white p-4"
              >
                <h2 className="text-base font-semibold text-gray-900">
                  {category.name}
                </h2>
                <h3 className="mt-3 text-sm font-semibold text-gray-700">
                  Active
                </h3>
                <ul className="mt-2 space-y-2">
                  {category.activeQuestions.map((question) => (
                    <li
                      key={question.id}
                      className="rounded-md border border-gray-200 bg-white p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{question.label}</p>
                          <div className="mt-1 flex items-center gap-2 text-xs">
                            <span className="rounded bg-gray-100 px-2 py-0.5 text-gray-700">
                              {question.type}
                            </span>
                            <span>
                              {question.required ? 'Required' : 'Optional'}
                            </span>
                            <span>Order: {question.order}</span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            className="rounded border border-gray-300 px-2 py-1 text-xs"
                            onClick={() =>
                              moveQuestion(category.id, question.id, -1)
                            }
                            type="button"
                          >
                            ↑
                          </button>
                          <button
                            className="rounded border border-gray-300 px-2 py-1 text-xs"
                            onClick={() =>
                              moveQuestion(category.id, question.id, 1)
                            }
                            type="button"
                          >
                            ↓
                          </button>
                          <button
                            className="rounded border border-gray-300 px-2 py-1 text-xs"
                            onClick={() => startEdit(question)}
                            type="button"
                          >
                            Edit
                          </button>
                          <button
                            className="rounded border border-gray-300 px-2 py-1 text-xs"
                            onClick={() =>
                              updateQuestion.mutate({
                                id: question.id,
                                payload: { isArchived: !question.isArchived }
                              })
                            }
                            type="button"
                          >
                            {question.isArchived ? 'Unarchive' : 'Archive'}
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                  {category.activeQuestions.length === 0 ? (
                    <li className="rounded-md border border-dashed border-gray-300 p-3 text-sm text-gray-500">
                      No active questions in this category.
                    </li>
                  ) : null}
                </ul>

                <h3 className="mt-4 text-sm font-semibold text-gray-700">
                  Archived
                </h3>
                <ul className="mt-2 space-y-2">
                  {category.archivedQuestions.map((question) => (
                    <li
                      key={question.id}
                      className="rounded-md border border-gray-200 bg-gray-50 p-3 text-gray-500"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{question.label}</p>
                          <div className="mt-1 flex items-center gap-2 text-xs">
                            <span className="rounded bg-gray-100 px-2 py-0.5 text-gray-700">
                              {question.type}
                            </span>
                            <span>
                              {question.required ? 'Required' : 'Optional'}
                            </span>
                            <span>Order: {question.order}</span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            className="rounded border border-gray-300 px-2 py-1 text-xs"
                            onClick={() =>
                              updateQuestion.mutate({
                                id: question.id,
                                payload: { isArchived: false }
                              })
                            }
                            type="button"
                          >
                            Unarchive
                          </button>
                          <button
                            className="rounded border border-gray-300 px-2 py-1 text-xs"
                            onClick={() => startEdit(question)}
                            type="button"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                  {category.archivedQuestions.length === 0 ? (
                    <li className="rounded-md border border-dashed border-gray-300 p-3 text-sm text-gray-500">
                      No archived questions in this category.
                    </li>
                  ) : null}
                </ul>
              </article>
            ))}
          </div>
        </>
      ) : null}
    </section>
  )
}
