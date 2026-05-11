import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type PinnedActionBarProps = {
  children: ReactNode
  className?: string
}

/**
 * Fixed action strip above the bottom tab bar. Use for all primary screen
 * CTAs — see DESIGN.md “Pinned CTA bar”.
 */
export function PinnedActionBar({ children, className }: PinnedActionBarProps) {
  return (
    <div
      className={cn(
        'fixed inset-x-0 z-30 border-t border-border bg-background/95 px-4 pt-2 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-6',
        className
      )}
      style={{
        bottom: 'calc(3.5rem + env(safe-area-inset-bottom, 0px))',
        paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0px))'
      }}
    >
      <div className="mx-auto flex max-w-3xl gap-2">{children}</div>
    </div>
  )
}
