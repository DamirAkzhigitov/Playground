import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiRequest } from '../lib/api'
import type {
  CompareGroup,
  CompareGroupView,
  CreateCompareGroupInput,
  UpdateCompareGroupInput
} from '../types'
import { queryKeys } from './queryKeys'

export const usePublicCompareGroups = () =>
  useQuery({
    queryKey: queryKeys.publicCompareGroups,
    queryFn: () => apiRequest<CompareGroup[]>('/api/compare-groups/public')
  })

export const useMyCompareGroups = () =>
  useQuery({
    queryKey: queryKeys.compareGroups,
    queryFn: () => apiRequest<CompareGroup[]>('/api/compare-groups')
  })

export const useCompareGroupView = (id?: string) =>
  useQuery({
    queryKey: id
      ? queryKeys.compareGroupView(id)
      : ['compareGroups', 'unknown'],
    queryFn: () =>
      apiRequest<CompareGroupView>(`/api/compare-groups/${id}/view`),
    enabled: Boolean(id)
  })

export const useCreateCompareGroup = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateCompareGroupInput) =>
      apiRequest<CompareGroup>('/api/compare-groups', {
        method: 'POST',
        body: payload
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.compareGroups })
    }
  })
}

export const useUpdateCompareGroup = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      payload
    }: {
      id: string
      payload: UpdateCompareGroupInput
    }) =>
      apiRequest<CompareGroup>(`/api/compare-groups/${id}`, {
        method: 'PATCH',
        body: payload
      }),
    onSuccess: async (_, { id }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.compareGroups }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.compareGroupView(id)
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.publicCompareGroups
        })
      ])
    }
  })
}

export const useDeleteCompareGroup = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiRequest<void>(`/api/compare-groups/${id}`, { method: 'DELETE' }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.compareGroups })
    }
  })
}

export const useSetCompareGroupItems = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, itemIds }: { id: string; itemIds: string[] }) =>
      apiRequest<{ ok: boolean }>(`/api/compare-groups/${id}/items`, {
        method: 'PUT',
        body: { itemIds }
      }),
    onSuccess: async (_, { id }) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.compareGroupView(id)
      })
    }
  })
}
