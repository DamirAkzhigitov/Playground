import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiRequest } from '../lib/api'
import type {
  Apartment,
  ApartmentDetail,
  CreateApartmentInput,
  UpdateApartmentInput
} from '../types'
import { queryKeys } from './queryKeys'

export const useApartments = () =>
  useQuery({
    queryKey: queryKeys.apartments,
    queryFn: () => apiRequest<Apartment[]>('/api/apartments')
  })

export const useApartment = (id?: string) =>
  useQuery({
    queryKey: id ? queryKeys.apartment(id) : queryKeys.apartment('unknown'),
    queryFn: () => apiRequest<ApartmentDetail>(`/api/apartments/${id}`),
    enabled: Boolean(id)
  })

export const useCreateApartment = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateApartmentInput) =>
      apiRequest<Apartment>('/api/apartments', {
        method: 'POST',
        body: payload
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.apartments })
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
      apiRequest<Apartment>(`/api/apartments/${id}`, {
        method: 'PATCH',
        body: payload
      }),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.apartments }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.apartment(variables.id)
        })
      ])
    }
  })
}

export const useDeleteApartment = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiRequest<void>(`/api/apartments/${id}`, { method: 'DELETE' }),
    onSuccess: async (_, id) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.apartments }),
        queryClient.invalidateQueries({ queryKey: queryKeys.apartment(id) })
      ])
    }
  })
}
