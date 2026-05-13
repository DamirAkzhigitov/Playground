import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiRequest } from '../lib/api'
import type {
  Apartment,
  ApartmentDetail,
  CreateApartmentInput,
  UpdateApartmentInput
} from '../types'
import { queryKeys } from './queryKeys'

export const useListings = () =>
  useQuery({
    queryKey: queryKeys.listings,
    queryFn: () => apiRequest<Apartment[]>('/api/listings'),
    select: (data): Apartment[] => (Array.isArray(data) ? data : [])
  })

export const useApartment = (id?: string) =>
  useQuery({
    queryKey: id ? queryKeys.listing(id) : queryKeys.listing('unknown'),
    queryFn: () => apiRequest<ApartmentDetail>(`/api/listings/${id}`),
    enabled: Boolean(id)
  })

export const useCreateApartment = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateApartmentInput) =>
      apiRequest<Apartment>('/api/listings', {
        method: 'POST',
        body: payload
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.listings })
    }
  })
}

export const useUpdateApartment = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      payload
    }: {
      id: string
      payload: UpdateApartmentInput
    }) =>
      apiRequest<Apartment>(`/api/listings/${id}`, {
        method: 'PATCH',
        body: payload
      }),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.listings }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.listing(variables.id)
        })
      ])
    }
  })
}

export const useDeleteApartment = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiRequest<void>(`/api/listings/${id}`, { method: 'DELETE' }),
    onSuccess: async (_, id) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.listings }),
        queryClient.invalidateQueries({ queryKey: queryKeys.listing(id) })
      ])
    }
  })
}
