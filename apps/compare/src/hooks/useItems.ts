import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiRequest } from '../lib/api'
import type {
  CreateItemInput,
  Item,
  ItemDetail,
  UpdateItemInput
} from '../types'
import { queryKeys } from './queryKeys'

export const useItems = (itemTypeId?: string) =>
  useQuery({
    queryKey: queryKeys.items(itemTypeId),
    queryFn: () =>
      apiRequest<Item[]>(
        itemTypeId
          ? `/api/items?itemTypeId=${encodeURIComponent(itemTypeId)}`
          : '/api/items'
      ),
    select: (data): Item[] => (Array.isArray(data) ? data : [])
  })

export const useItem = (id?: string) =>
  useQuery({
    queryKey: id ? queryKeys.item(id) : queryKeys.item('unknown'),
    queryFn: () => apiRequest<ItemDetail>(`/api/items/${id}`),
    enabled: Boolean(id)
  })

export const useCreateItem = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateItemInput) =>
      apiRequest<Item>('/api/items', {
        method: 'POST',
        body: payload
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['items'] })
    }
  })
}

export const useUpdateItem = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateItemInput }) =>
      apiRequest<Item>(`/api/items/${id}`, {
        method: 'PATCH',
        body: payload
      }),
    onSuccess: async (_, { id }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['items'] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.item(id) })
      ])
    }
  })
}

export const useDeleteItem = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiRequest<void>(`/api/items/${id}`, { method: 'DELETE' }),
    onSuccess: async (_, id) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['items'] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.item(id) })
      ])
    }
  })
}
