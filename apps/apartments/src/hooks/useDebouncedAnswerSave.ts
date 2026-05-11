import { useCallback, useEffect, useRef } from 'react'

import type { UpsertAnswerInput } from '@/types'

type Mutate = (input: { answer: UpsertAnswerInput }) => Promise<unknown>

/** DOM timer id; avoids NodeJS.Timeout vs number conflicts under @types/node. */
type TimerId = number

export function useDebouncedAnswerSave(
  mutateAsync: Mutate,
  delayMs = 450
): {
  queueSave: (input: UpsertAnswerInput) => void
  flushSave: () => Promise<void>
} {
  const timerRef = useRef<TimerId | undefined>(undefined)
  const pendingRef = useRef<UpsertAnswerInput | null>(null)

  const flushSave = useCallback(async () => {
    window.clearTimeout(timerRef.current)
    const pending = pendingRef.current
    pendingRef.current = null
    if (pending) {
      await mutateAsync({ answer: pending })
    }
  }, [mutateAsync])

  const queueSave = useCallback(
    (input: UpsertAnswerInput) => {
      pendingRef.current = input
      window.clearTimeout(timerRef.current)
      timerRef.current = window.setTimeout(() => {
        const p = pendingRef.current
        pendingRef.current = null
        if (p) {
          void mutateAsync({ answer: p })
        }
      }, delayMs) as TimerId
    },
    [delayMs, mutateAsync]
  )

  useEffect(() => {
    return () => {
      window.clearTimeout(timerRef.current)
    }
  }, [])

  return { queueSave, flushSave }
}

export function useKeyedDebouncedAnswerSave(
  mutateAsync: Mutate,
  delayMs = 450
): {
  queueSave: (input: UpsertAnswerInput) => void
  flushSave: () => Promise<void>
} {
  const timersRef = useRef<Record<string, TimerId>>({})
  const pendingRef = useRef<Record<string, UpsertAnswerInput>>({})

  const flushSave = useCallback(async () => {
    for (const key of Object.keys(timersRef.current)) {
      window.clearTimeout(timersRef.current[key])
      delete timersRef.current[key]
    }
    const batch = { ...pendingRef.current }
    pendingRef.current = {}
    await Promise.all(
      Object.values(batch).map((input) => mutateAsync({ answer: input }))
    )
  }, [mutateAsync])

  const queueSave = useCallback(
    (input: UpsertAnswerInput) => {
      const key = input.questionId
      pendingRef.current[key] = input
      window.clearTimeout(timersRef.current[key])
      timersRef.current[key] = window.setTimeout(() => {
        const payload = pendingRef.current[key]
        delete pendingRef.current[key]
        delete timersRef.current[key]
        if (payload) {
          void mutateAsync({ answer: payload })
        }
      }, delayMs) as TimerId
    },
    [delayMs, mutateAsync]
  )

  useEffect(() => {
    const timers = timersRef
    return () => {
      const snapshot = timers.current
      for (const key of Object.keys(snapshot)) {
        window.clearTimeout(snapshot[key])
      }
    }
  }, [])

  return { queueSave, flushSave }
}
