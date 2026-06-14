import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiRequest } from '../lib/api'
import type {
  CreateItemTypeInput,
  CreateSpecInput,
  ItemType,
  Spec,
  SpecSection
} from '../types'
import { queryKeys } from './queryKeys'

export const useItemTypes = () =>
  useQuery({
    queryKey: queryKeys.itemTypes,
    queryFn: () => apiRequest<ItemType[]>('/api/item-types')
  })

export const useItemTypeTemplate = (id?: string) =>
  useQuery({
    queryKey: id ? queryKeys.itemTypeTemplate(id) : ['itemTypes', 'unknown'],
    queryFn: () => apiRequest<SpecSection[]>(`/api/item-types/${id}/template`),
    enabled: Boolean(id)
  })

export const useCreateItemType = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateItemTypeInput) =>
      apiRequest<ItemType>('/api/item-types', {
        method: 'POST',
        body: payload
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.itemTypes })
    }
  })
}

export const useDeleteItemType = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiRequest<void>(`/api/item-types/${id}`, { method: 'DELETE' }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.itemTypes })
    }
  })
}

export const useCreateSpec = (typeId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateSpecInput) =>
      apiRequest<Spec>(`/api/item-types/${typeId}/specs`, {
        method: 'POST',
        body: payload
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.itemTypeTemplate(typeId)
      })
    }
  })
}
