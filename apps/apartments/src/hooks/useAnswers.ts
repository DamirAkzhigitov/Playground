import { useMutation, useQueryClient } from '@tanstack/react-query'

import { apiRequest } from '../lib/api'
import type { Answer, UpsertAnswerPayload } from '../types'
import { queryKeys } from './queryKeys'

export const useUpsertAnswer = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpsertAnswerPayload) =>
      apiRequest<Answer | Answer[]>('/api/answers', {
        method: 'POST',
        body: payload
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.apartments })
    }
  })
}
