import { useEffect, useRef } from 'react'
import { List } from 'lucide-react'

import type { ActionStep, StepProgress, StepRequirement } from '@/types'
import { MarkdownBody } from '@/components/MarkdownBody'
import { RequirementList } from '@/components/RequirementList'
import { StepProgressBar } from '@/components/StepProgressBar'
import { StepOutline } from '@/components/action/StepOutline'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet'

type GuideStep = {
  id: string
  order: number
  title: string
  bodyMd: string | null
  estimatedMinutes: number | null
}

type ActionGuideLayoutProps = {
  actionTitle: string
  steps: GuideStep[]
  requirements: StepRequirement[]
  activeOrder: number
  progressMap: Record<string, StepProgress>
  note: string
  onNoteChange: (value: string) => void
  onSelectStep: (order: number) => void
  onMarkDone: () => void
  onSkip: () => void
  onPrev: () => void
  onNext: () => void
  isSaving?: boolean
}

export function ActionGuideLayout({
  actionTitle,
  steps,
  requirements,
  activeOrder,
  progressMap,
  note,
  onNoteChange,
  onSelectStep,
  onMarkDone,
  onSkip,
  onPrev,
  onNext,
  isSaving
}: ActionGuideLayoutProps) {
  const activeStep = steps.find((s) => s.order === activeOrder) ?? steps[0]!
  const stepReqs = requirements.filter((r) => r.stepId === activeStep.id)
  const total = steps.length
  const doneCount = steps.filter(
    (s) => progressMap[s.id]?.status === 'done'
  ).length
  const percent = total > 0 ? Math.round((doneCount / total) * 100) : 0

  const panelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    panelRef.current?.focus({ preventScroll: true })
  }, [activeOrder])

  const getStatus = (stepId: string) => progressMap[stepId]?.status ?? 'pending'

  const outline = (
    <StepOutline
      steps={steps as ActionStep[]}
      activeOrder={activeOrder}
      getStatus={getStatus}
      onSelect={onSelectStep}
    />
  )

  return (
    <div className="space-y-4 pb-page-pinned">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">{actionTitle}</p>
        <StepProgressBar
          current={activeOrder}
          total={total}
          percent={percent}
        />
      </div>

      <div className="lg:grid lg:grid-cols-[minmax(0,14rem)_1fr] lg:gap-6">
        <aside className="hidden lg:block">
          <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Outline
          </h2>
          {outline}
        </aside>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2 lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <List className="size-4" aria-hidden="true" />
                  Steps
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle>Step outline</SheetTitle>
                </SheetHeader>
                {outline}
              </SheetContent>
            </Sheet>
            <span className="text-xs text-muted-foreground" aria-live="polite">
              Step {activeOrder} of {total}
              {isSaving ? ' · Saving…' : ''}
            </span>
          </div>

          <article
            ref={panelRef}
            tabIndex={-1}
            className="rounded-xl border bg-card p-4 sm:p-6 outline-none"
            aria-live="polite"
          >
            <h2 className="text-lg font-semibold">{activeStep.title}</h2>
            {activeStep.estimatedMinutes ? (
              <p className="mt-1 text-xs text-muted-foreground">
                ~{activeStep.estimatedMinutes} min
              </p>
            ) : null}

            {activeStep.bodyMd ? (
              <div className="mt-4">
                <MarkdownBody content={activeStep.bodyMd} />
              </div>
            ) : null}

            <RequirementList requirements={stepReqs} className="mt-6" />

            <div className="mt-6 space-y-2">
              <label htmlFor="step-note" className="text-sm font-medium">
                Your notes
              </label>
              <Textarea
                id="step-note"
                value={note}
                onChange={(e) => onNoteChange(e.target.value)}
                placeholder="Add notes for this step…"
                rows={3}
              />
            </div>
          </article>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 px-4 py-3 backdrop-blur pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
        <div className="mx-auto flex max-w-4xl flex-wrap gap-2">
          <Button onClick={onMarkDone} disabled={isSaving}>
            Mark done
          </Button>
          <Button variant="outline" onClick={onSkip} disabled={isSaving}>
            Skip
          </Button>
          <div className="ml-auto flex gap-2">
            <Button
              variant="outline"
              onClick={onPrev}
              disabled={activeOrder <= 1 || isSaving}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={onNext}
              disabled={activeOrder >= total || isSaving}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
