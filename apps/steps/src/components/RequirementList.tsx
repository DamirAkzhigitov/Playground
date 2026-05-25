import { Circle, ExternalLink } from 'lucide-react'

import type { StepRequirement } from '@/types'
import { cn } from '@/lib/utils'

type RequirementListProps = {
  requirements: StepRequirement[]
  className?: string
}

export function RequirementList({
  requirements,
  className
}: RequirementListProps) {
  if (requirements.length === 0) return null

  return (
    <section className={cn('space-y-2', className)}>
      <h3 className="text-sm font-medium">Requirements</h3>
      <ul className="space-y-2">
        {requirements.map((req) => (
          <li
            key={req.id}
            className="flex items-start gap-2 text-sm text-muted-foreground"
          >
            <Circle
              className="mt-0.5 size-4 shrink-0 text-muted-foreground/60"
              aria-hidden="true"
            />
            <span>
              {req.label}
              {req.kind === 'link' && req.details ? (
                <>
                  {' '}
                  <a
                    href={req.details}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 text-primary underline"
                  >
                    Open
                    <ExternalLink className="size-3" aria-hidden="true" />
                  </a>
                </>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
