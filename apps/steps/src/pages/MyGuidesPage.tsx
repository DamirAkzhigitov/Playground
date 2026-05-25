import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { PageHeader } from '@/components/PageHeader'
import { StepProgressBar } from '@/components/StepProgressBar'
import { ErrorState } from '@/components/ErrorState'
import { LoadingState } from '@/components/LoadingState'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { queryKeys } from '@/lib/queryKeys'
import { deleteEnrollment, listEnrollments } from '@/lib/stepsApi'
import type { EnrollmentListItem } from '@/types'

function continueHref(item: EnrollmentListItem): string {
  const step = Math.max(1, item.progress.done + 1)
  const capped = Math.min(step, item.progress.stepCount || step)
  return `/actions/${item.actionSlug}?enrollment=${item.id}&step=${capped}`
}

function EnrollmentRow({ item }: { item: EnrollmentListItem }) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)

  const abandonMutation = useMutation({
    mutationFn: () => deleteEnrollment(item.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.enrollments.all })
      toast.success('Guide abandoned')
      setOpen(false)
    },
    onError: () => toast.error('Could not abandon guide')
  })

  const currentStep = Math.min(
    item.progress.stepCount || 1,
    Math.max(1, item.progress.done + 1)
  )

  return (
    <li className="rounded-xl border bg-card p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <Link
            to={`/actions/${item.actionSlug}`}
            className="font-medium hover:text-primary"
          >
            {item.actionTitle}
          </Link>
          <StepProgressBar
            current={currentStep}
            total={item.progress.stepCount || 1}
            percent={item.progress.percent}
          />
          <p className="text-xs text-muted-foreground">
            Started {new Date(item.startedAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button asChild size="sm">
            <Link to={continueHref(item)}>Continue</Link>
          </Button>
          <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm">
                Abandon
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Abandon this guide?</AlertDialogTitle>
                <AlertDialogDescription>
                  Your progress and notes for this guide will be permanently
                  removed. You can start again later from the action page.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault()
                    abandonMutation.mutate()
                  }}
                  disabled={abandonMutation.isPending}
                >
                  Abandon
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </li>
  )
}

export function MyGuidesPage() {
  const enrollmentsQuery = useQuery({
    queryKey: queryKeys.enrollments.list(),
    queryFn: listEnrollments
  })

  const { inProgress, completed } = useMemo(() => {
    const items = enrollmentsQuery.data?.items ?? []
    return {
      inProgress: items
        .filter((i) => !i.isCompleted)
        .sort(
          (a, b) =>
            new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
        ),
      completed: items
        .filter((i) => i.isCompleted)
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
    }
  }, [enrollmentsQuery.data])

  if (enrollmentsQuery.isLoading) {
    return <LoadingState label="Loading your guides…" />
  }

  if (enrollmentsQuery.isError) {
    return (
      <ErrorState
        message="Could not load your guides."
        onRetry={() => enrollmentsQuery.refetch()}
      />
    )
  }

  const empty = inProgress.length === 0 && completed.length === 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="My guides"
        description="Continue in-progress guides or review completed ones."
      />

      {empty ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-sm">
          <p className="font-medium">No guides yet</p>
          <p className="mt-2 text-muted-foreground">
            Browse actions and start a guide to track your progress.
          </p>
          <Button asChild className="mt-4">
            <Link to="/actions">Browse actions</Link>
          </Button>
        </div>
      ) : (
        <Tabs defaultValue="in-progress">
          <TabsList>
            <TabsTrigger value="in-progress">
              In progress ({inProgress.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({completed.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="in-progress" className="mt-4">
            {inProgress.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No guides in progress.
              </p>
            ) : (
              <ul className="space-y-3">
                {inProgress.map((item) => (
                  <EnrollmentRow key={item.id} item={item} />
                ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="completed" className="mt-4">
            {completed.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No completed guides yet.
              </p>
            ) : (
              <ul className="space-y-3">
                {completed.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-xl border bg-card p-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <Link
                        to={`/actions/${item.actionSlug}`}
                        className="font-medium hover:text-primary"
                      >
                        {item.actionTitle}
                      </Link>
                      <p className="text-xs text-muted-foreground mt-1">
                        Completed{' '}
                        {new Date(item.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/actions/${item.actionSlug}`}>
                        View action
                      </Link>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
