import { useMutation, useQueryClient } from '@tanstack/react-query'

import { apiRequest } from '../lib/api'
import type { UpsertAnswerPayload } from '../types'
import { queryKeys } from './queryKeys'

type UpsertAnswerResponse = { ok: boolean; updated: number }

const listingIdsFromPayload = (payload: UpsertAnswerPayload): string[] => {
  if ('answer' in payload) {
    return [payload.answer.listingId]
  }
  return [...new Set(payload.answers.map((a) => a.listingId))]
}

export const useUpsertAnswer = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpsertAnswerPayload) =>
      apiRequest<UpsertAnswerResponse>('/api/answers', {
        method: 'POST',
        body: payload
      }),
    onSuccess: async (_, payload) => {
      const ids = listingIdsFromPayload(payload)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.listings }),
        ...ids.map((id) =>
          queryClient.invalidateQueries({ queryKey: queryKeys.listing(id) })
        )
      ])
    }
  })
}
