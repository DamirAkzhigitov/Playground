import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiRequest } from '../lib/api'
import type {
  Category,
  CreateCategoryInput,
  UpdateCategoryInput
} from '../types'
import { queryKeys } from './queryKeys'

export const useCategories = () =>
  useQuery({
    queryKey: queryKeys.categories,
    queryFn: () => apiRequest<Category[]>('/api/categories')
  })

export const useCreateCategory = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateCategoryInput) =>
      apiRequest<Category>('/api/categories', {
        method: 'POST',
        body: payload
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.categories })
    }
  })
}

export const useUpdateCategory = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      payload
    }: {
      id: string
      payload: UpdateCategoryInput
    }) =>
      apiRequest<Category>(`/api/categories/${id}`, {
        method: 'PATCH',
        body: payload
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.categories })
    }
  })
}

export const useDeleteCategory = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiRequest<void>(`/api/categories/${id}`, { method: 'DELETE' }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.categories })
    }
  })
}
