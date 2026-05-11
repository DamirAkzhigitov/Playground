import { useMutation, useQueryClient } from '@tanstack/react-query'

import { apiRequest } from '../lib/api'
import type { DeletePhotoInput, Photo, UploadPhotoInput } from '../types'
import { queryKeys } from './queryKeys'

export const useUploadPhoto = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: UploadPhotoInput) => {
      const formData = new FormData()
      formData.append('apartmentId', payload.apartmentId)
      if (payload.questionId) {
        formData.append('questionId', payload.questionId)
      }
      formData.append('file', payload.file)
      return apiRequest<Photo>('/api/photos/upload', {
        method: 'POST',
        body: formData
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.apartments })
    }
  })
}

export const useDeletePhoto = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id }: DeletePhotoInput) =>
      apiRequest<void>(`/api/photos/${id}`, { method: 'DELETE' }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.apartments })
    }
  })
}
