import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiRequest } from '../lib/api'
import type {
  Listing,
  ListingDetail,
  CreateListingInput,
  UpdateListingInput
} from '../types'
import { queryKeys } from './queryKeys'

export const useListings = () =>
  useQuery({
    queryKey: queryKeys.listings,
    queryFn: () => apiRequest<Listing[]>('/api/listings'),
    select: (data): Listing[] => (Array.isArray(data) ? data : [])
  })

export const useListing = (id?: string) =>
  useQuery({
    queryKey: id ? queryKeys.listing(id) : queryKeys.listing('unknown'),
    queryFn: () => apiRequest<ListingDetail>(`/api/listings/${id}`),
    enabled: Boolean(id)
  })

export const useCreateListing = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateListingInput) =>
      apiRequest<Listing>('/api/listings', {
        method: 'POST',
        body: payload
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.listings })
    }
  })
}

export const useUpdateListing = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      payload
    }: {
      id: string
      payload: UpdateListingInput
    }) =>
      apiRequest<Listing>(`/api/listings/${id}`, {
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

export const useDeleteListing = () => {
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
