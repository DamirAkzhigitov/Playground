import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiRequest } from '../lib/api'
import type {
  CreateQuestionInput,
  Question,
  ReorderQuestionInput,
  UpdateQuestionInput
} from '../types'
import { queryKeys } from './queryKeys'

export const useQuestions = () =>
  useQuery({
    queryKey: queryKeys.questions,
    queryFn: () => apiRequest<Question[]>('/api/questions')
  })

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
