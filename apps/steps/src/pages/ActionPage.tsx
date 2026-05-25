import { useCallback, useMemo, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { ActionGuideLayout } from '@/components/action/ActionGuideLayout'
import { SignInPrompt } from '@/components/action/SignInPrompt'
import { PageHeader } from '@/components/PageHeader'
import { ErrorState } from '@/components/ErrorState'
import { LoadingState } from '@/components/LoadingState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { useAuth } from '@/contexts/AuthContext'
import { queryKeys } from '@/lib/queryKeys'
import {
  createEnrollment,
  deleteEnrollment,
  getAction,
  getEnrollment,
  listEnrollments,
  patchStepProgress
} from '@/lib/stepsApi'
import type { ActionStep, StepProgress, StepProgressStatus } from '@/types'

function firstIncompleteOrder(
  steps: ActionStep[],
  progress: Record<string, StepProgress>
): number {
  for (const step of steps) {
    const status = progress[step.id]?.status
    if (status !== 'done' && status !== 'skipped') return step.order
  }
  return steps[0]?.order ?? 1
}

function totalEstimatedMinutes(steps: ActionStep[]): number | null {
  const sum = steps.reduce((acc, s) => acc + (s.estimatedMinutes ?? 0), 0)
  return sum > 0 ? sum : null
}

export function ActionPage() {
  const { slug } = useParams<{ slug: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const stepParam = searchParams.get('step')
  const enrollmentParam = searchParams.get('enrollment')

  const actionQuery = useQuery({
    queryKey: queryKeys.actions.detail(slug ?? ''),
    queryFn: () => getAction(slug!),
    enabled: Boolean(slug)
  })

  const enrollmentsQuery = useQuery({
    queryKey: queryKeys.enrollments.list(),
    queryFn: listEnrollments,
    enabled: Boolean(user)
  })

  const actionId = actionQuery.data?.action.id

  const matchingEnrollments = useMemo(() => {
    if (!enrollmentsQuery.data || !actionId) return []
    return enrollmentsQuery.data.items
      .filter((e) => e.actionId === actionId)
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )
  }, [enrollmentsQuery.data, actionId])

  const activeEnrollmentId = useMemo(() => {
    if (enrollmentParam) {
      const found = matchingEnrollments.find((e) => e.id === enrollmentParam)
      if (found) return found.id
    }
    const inProgress = matchingEnrollments.find((e) => !e.isCompleted)
    return inProgress?.id ?? matchingEnrollments[0]?.id ?? null
  }, [enrollmentParam, matchingEnrollments])

  const enrollmentDetailQuery = useQuery({
    queryKey: queryKeys.enrollments.detail(activeEnrollmentId ?? ''),
    queryFn: () => getEnrollment(activeEnrollmentId!),
    enabled: Boolean(user && activeEnrollmentId)
  })

  const steps = useMemo(
    () => actionQuery.data?.steps ?? [],
    [actionQuery.data?.steps]
  )
  const requirements = useMemo(
    () => actionQuery.data?.requirements ?? [],
    [actionQuery.data?.requirements]
  )
  const progressMap = useMemo(
    () => enrollmentDetailQuery.data?.progress ?? {},
    [enrollmentDetailQuery.data?.progress]
  )

  const activeOrder = useMemo(() => {
    if (stepParam) {
      const n = Number(stepParam)
      if (n >= 1 && n <= steps.length) return n
    }
    if (enrollmentDetailQuery.data) {
      return firstIncompleteOrder(steps, progressMap)
    }
    return 1
  }, [stepParam, steps, enrollmentDetailQuery.data, progressMap])

  const isGuideMode =
    Boolean(activeEnrollmentId && enrollmentDetailQuery.data) &&
    stepParam !== null

  const setStepInUrl = useCallback(
    (order: number, enrollmentId?: string) => {
      const next = new URLSearchParams(searchParams)
      next.set('step', String(order))
      if (enrollmentId) next.set('enrollment', enrollmentId)
      setSearchParams(next, { replace: true })
    },
    [searchParams, setSearchParams]
  )

  const createMutation = useMutation({
    mutationFn: () => createEnrollment(actionId!),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.enrollments.all })
      setStepInUrl(1, data.enrollment.id)
      toast.success('Guide started')
    },
    onError: () => toast.error('Could not start guide')
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteEnrollment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.enrollments.all })
      setSearchParams({}, { replace: true })
      toast.success('Progress removed')
    },
    onError: () => toast.error('Could not remove progress')
  })

  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({})
  const noteDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const activeStepId = steps.find((s) => s.order === activeOrder)?.id
  const note =
    activeStepId !== undefined
      ? (noteDrafts[activeStepId] ?? progressMap[activeStepId]?.note ?? '')
      : ''

  const saveProgress = useCallback(
    async (payload: {
      stepId: string
      status?: StepProgressStatus
      note?: string | null
    }) => {
      if (!activeEnrollmentId) return
      setIsSaving(true)
      try {
        await patchStepProgress(activeEnrollmentId, payload)
        await queryClient.invalidateQueries({
          queryKey: queryKeys.enrollments.detail(activeEnrollmentId)
        })
        queryClient.invalidateQueries({ queryKey: queryKeys.enrollments.all })
      } finally {
        setIsSaving(false)
      }
    },
    [activeEnrollmentId, queryClient]
  )

  const handleNoteChange = (value: string) => {
    if (!activeStepId) return
    setNoteDrafts((prev) => ({ ...prev, [activeStepId]: value }))
    if (noteDebounceRef.current) clearTimeout(noteDebounceRef.current)
    noteDebounceRef.current = setTimeout(() => {
      void saveProgress({ stepId: activeStepId, note: value || null })
    }, 500)
  }

  const handleMarkDone = () => {
    if (!activeStepId) return
    void saveProgress({ stepId: activeStepId, status: 'done' }).then(() => {
      if (activeOrder < steps.length) setStepInUrl(activeOrder + 1)
    })
  }

  const handleSkip = () => {
    if (!activeStepId) return
    void saveProgress({ stepId: activeStepId, status: 'skipped' }).then(() => {
      if (activeOrder < steps.length) setStepInUrl(activeOrder + 1)
    })
  }

  if (!slug) {
    return <ErrorState message="Missing action slug." />
  }

  if (actionQuery.isLoading) {
    return <LoadingState label="Loading action…" />
  }

  if (actionQuery.isError || !actionQuery.data) {
    return (
      <ErrorState
        message="Action not found."
        onRetry={() => actionQuery.refetch()}
      />
    )
  }

  const { action } = actionQuery.data
  const estTotal = totalEstimatedMinutes(steps)
  const hasEnrollment = matchingEnrollments.length > 0
  const inProgressEnrollment = matchingEnrollments.find((e) => !e.isCompleted)

  if (isGuideMode && enrollmentDetailQuery.data) {
    const guideSteps = enrollmentDetailQuery.data.steps
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const next = new URLSearchParams(searchParams)
              next.delete('step')
              setSearchParams(next, { replace: true })
            }}
          >
            ← Overview
          </Button>
        </div>
        <ActionGuideLayout
          actionTitle={action.title}
          steps={guideSteps}
          requirements={requirements}
          activeOrder={activeOrder}
          progressMap={progressMap}
          note={note}
          onNoteChange={handleNoteChange}
          onSelectStep={(order) => setStepInUrl(order, activeEnrollmentId!)}
          onMarkDone={handleMarkDone}
          onSkip={handleSkip}
          onPrev={() => setStepInUrl(Math.max(1, activeOrder - 1))}
          onNext={() => setStepInUrl(Math.min(steps.length, activeOrder + 1))}
          isSaving={isSaving}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={action.title}
        description={action.summary ?? undefined}
      />

      <div className="flex flex-wrap gap-2">
        {action.tags.map((tag) => (
          <Badge key={tag} variant="tag">
            {tag}
          </Badge>
        ))}
        {estTotal ? (
          <span className="text-xs text-muted-foreground self-center">
            ~{estTotal} min total
          </span>
        ) : null}
      </div>

      {!user ? <SignInPrompt /> : null}

      <section className="space-y-3">
        <h2 className="text-sm font-medium">Steps in this guide</h2>
        <ol className="space-y-2 rounded-xl border divide-y">
          {steps.map((step) => (
            <li
              key={step.id}
              className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
            >
              <span>
                <span className="text-muted-foreground">{step.order}.</span>{' '}
                {step.title}
              </span>
              {step.estimatedMinutes ? (
                <span className="shrink-0 text-xs text-muted-foreground">
                  ~{step.estimatedMinutes} min
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      </section>

      <div className="flex flex-wrap gap-2">
        {!user ? (
          <Button asChild>
            <Link
              to={`/login?returnUrl=${encodeURIComponent(`/actions/${slug}`)}`}
            >
              Sign in to start
            </Link>
          </Button>
        ) : inProgressEnrollment ? (
          <>
            <Button
              onClick={() => {
                const order = Math.min(
                  inProgressEnrollment.progress.stepCount || steps.length,
                  Math.max(1, inProgressEnrollment.progress.done + 1)
                )
                setStepInUrl(order, inProgressEnrollment.id)
              }}
            >
              Continue guide
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline">Drop progress</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Drop all progress?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This removes your enrollment and step notes for this action.
                    You can start a new guide afterward.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(e) => {
                      e.preventDefault()
                      deleteMutation.mutate(inProgressEnrollment.id)
                    }}
                  >
                    Drop progress
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        ) : hasEnrollment ? (
          <>
            <Button
              disabled={createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              Start again
            </Button>
            <Button variant="outline" asChild>
              <Link
                to={`/actions/${slug}?enrollment=${matchingEnrollments[0]!.id}&step=1`}
              >
                View last guide
              </Link>
            </Button>
          </>
        ) : (
          <Button
            disabled={createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            Start guide
          </Button>
        )}
        <Button variant="outline" asChild>
          <Link to="/actions">Back to catalog</Link>
        </Button>
      </div>
    </div>
  )
}
