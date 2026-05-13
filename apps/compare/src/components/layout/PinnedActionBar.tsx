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
        'fixed inset-x-0 z-30 rounded-t-2xl border border-border/60 border-b-0 bg-card/95 px-4 pt-2 shadow-[0_-8px_30px_-12px_rgba(0,0,0,0.12)] backdrop-blur supports-[backdrop-filter]:bg-card/90 sm:px-6',
        className
      )}
      style={{
        bottom: 'var(--bottom-nav-stack)',
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))'
      }}
    >
      <div className="mx-auto flex max-w-3xl gap-2">{children}</div>
    </div>
  )
}
