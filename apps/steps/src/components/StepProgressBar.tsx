import { cn } from '@/lib/utils'

type StepProgressBarProps = {
  current: number
  total: number
  percent: number
  className?: string
}

export function StepProgressBar({
  current,
  total,
  percent,
  className
}: StepProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percent))

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Step {current} of {total}
        </span>
        <span aria-hidden="true">{clamped}%</span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${clamped} percent complete`}
      >
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}
