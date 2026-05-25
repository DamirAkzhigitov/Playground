import { Check, Circle, Minus } from 'lucide-react'

import type { ActionStep, StepProgressStatus } from '@/types'
import { cn } from '@/lib/utils'

type StepOutlineProps = {
  steps: ActionStep[]
  activeOrder: number
  getStatus: (stepId: string) => StepProgressStatus | 'pending'
  onSelect: (order: number) => void
  className?: string
}

function StepIcon({ status }: { status: StepProgressStatus | 'pending' }) {
  if (status === 'done') {
    return <Check className="size-4 text-primary" aria-hidden="true" />
  }
  if (status === 'skipped') {
    return <Minus className="size-4 text-muted-foreground" aria-hidden="true" />
  }
  return (
    <Circle className="size-4 text-muted-foreground/50" aria-hidden="true" />
  )
}

export function StepOutline({
  steps,
  activeOrder,
  getStatus,
  onSelect,
  className
}: StepOutlineProps) {
  return (
    <ol className={cn('space-y-1', className)}>
      {steps.map((step) => {
        const status = getStatus(step.id)
        const isActive = step.order === activeOrder
        return (
          <li key={step.id}>
            <button
              type="button"
              onClick={() => onSelect(step.order)}
              className={cn(
                'flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-accent/60',
                isActive && 'bg-accent font-medium text-accent-foreground'
              )}
              aria-current={isActive ? 'step' : undefined}
            >
              <StepIcon status={status} />
              <span className="min-w-0 flex-1">
                <span className="text-muted-foreground">{step.order}.</span>{' '}
                {step.title}
              </span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}
