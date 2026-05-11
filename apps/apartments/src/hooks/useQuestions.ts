import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiRequest } from '../lib/api'
import type {
  CreateQuestionInput,
  Question,
  QuestionGroup,
  ReorderQuestionInput,
  UpdateQuestionInput
} from '../types'
import { queryKeys } from './queryKeys'

export type UseQuestionsOptions = {
  includeArchived?: boolean
  /** When set, returns the checklist copied for this listing (template scope). */
  apartmentId?: string
}

function buildQuestionsQueryKey(opts: UseQuestionsOptions) {
  return [
    ...queryKeys.questions,
    {
      includeArchived: opts.includeArchived ?? false,
      apartmentId: opts.apartmentId
    }
  ] as const
}

export const useQuestions = (
  options: UseQuestionsOptions | boolean = false
) => {
  const opts: UseQuestionsOptions =
    typeof options === 'boolean' ? { includeArchived: options } : options
  const includeArchived = opts.includeArchived ?? false
  const apartmentId = opts.apartmentId

  const qs = new URLSearchParams({
    includeArchived: includeArchived ? 'true' : 'false'
  })
  if (apartmentId) {
    qs.set('apartmentId', apartmentId)
  }

  return useQuery({
    queryKey: buildQuestionsQueryKey(opts),
    queryFn: () =>
      apiRequest<QuestionGroup[]>(`/api/questions?${qs.toString()}`),
    select: (data): QuestionGroup[] => (Array.isArray(data) ? data : []),
    enabled: apartmentId === undefined || Boolean(apartmentId)
  })
}

export const useCreateQuestion = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateQuestionInput) =>
      apiRequest<Question>('/api/questions', { method: 'POST', body: payload }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.questions })
    }
  })
}

export const useUpdateQuestion = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      payload
    }: {
      id: string
      payload: UpdateQuestionInput
    }) =>
      apiRequest<Question>(`/api/questions/${id}`, {
        method: 'PATCH',
        body: payload
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.questions })
    }
  })
}

export const useReorderQuestions = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ReorderQuestionInput[]) =>
      apiRequest<Question[]>('/api/questions/reorder', {
        method: 'PATCH',
        body: { items: payload }
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.questions })
    }
  })
}
