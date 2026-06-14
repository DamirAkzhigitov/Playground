import { useMutation, useQueryClient } from '@tanstack/react-query'

import { apiRequest } from '../lib/api'
import type { UpsertAnswerPayload } from '../types'
import { queryKeys } from './queryKeys'

type UpsertAnswerResponse = { ok: boolean; updated: number }

const itemIdsFromPayload = (payload: UpsertAnswerPayload): string[] => {
  if ('answer' in payload) {
    return [payload.answer.itemId]
  }
  return [...new Set(payload.answers.map((a) => a.itemId))]
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
      const ids = itemIdsFromPayload(payload)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['items'] }),
        ...ids.map((id) =>
          queryClient.invalidateQueries({ queryKey: queryKeys.item(id) })
        )
      ])
    }
  })
}
