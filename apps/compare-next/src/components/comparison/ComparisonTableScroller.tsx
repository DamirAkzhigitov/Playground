'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

import { useI18n } from '@/contexts/I18nContext'
import { cn } from '@/lib/utils'

type ComparisonTableScrollerProps = {
  children: (scrollRef: React.RefObject<HTMLDivElement | null>) => ReactNode
  itemCount: number
}

type ScrollEdges = {
  right: boolean
}

function readScrollEdges(element: HTMLDivElement): ScrollEdges {
  const maxScrollLeft = element.scrollWidth - element.clientWidth
  return {
    right: maxScrollLeft > 4 && element.scrollLeft < maxScrollLeft - 4
  }
}

export function ComparisonTableScroller({
  children,
  itemCount
}: ComparisonTableScrollerProps) {
  const { t } = useI18n()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState<ScrollEdges>({ right: false })

  const updateEdges = useCallback(() => {
    const element = scrollRef.current
    if (!element) return
    setEdges(readScrollEdges(element))
  }, [])

  useEffect(() => {
    updateEdges()
    const element = scrollRef.current
    if (!element) return

    element.addEventListener('scroll', updateEdges, { passive: true })
    const observer = new ResizeObserver(updateEdges)
    observer.observe(element)
    return () => {
      element.removeEventListener('scroll', updateEdges)
      observer.disconnect()
    }
  }, [itemCount, updateEdges])

  const showHint = itemCount >= 3

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        {edges.right ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 z-40 w-8 bg-linear-to-l from-background to-transparent"
          />
        ) : null}
        {children(scrollRef)}
      </div>
      {showHint ? (
        <p
          className={cn(
            'text-xs text-muted-foreground',
            !edges.right && 'sr-only'
          )}
        >
          {t('comparison.scrollHint')}
        </p>
      ) : null}
    </div>
  )
}
