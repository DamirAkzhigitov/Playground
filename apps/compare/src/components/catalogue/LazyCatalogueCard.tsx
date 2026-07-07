import { useEffect, useRef, useState } from 'react'

import { CatalogueCard } from '@/components/catalogue/CatalogueCard'
import { catalogueSlotClass } from '@/lib/catalogueSlot'
import type { CatalogueEntry } from '@/types/catalogue'

function viewportRootMargin(): string {
  return `${Math.round(window.innerHeight)}px 0px`
}

type LazyCatalogueCardProps = {
  entry: CatalogueEntry
}

export function LazyCatalogueCard({ entry }: LazyCatalogueCardProps) {
  const slotRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const slot = slotRef.current
    if (!slot) return

    const observer = new IntersectionObserver(
      ([observed]) => {
        setVisible(observed.isIntersecting)
      },
      { rootMargin: viewportRootMargin() }
    )

    observer.observe(slot)
    return () => observer.disconnect()
  }, [entry.id])

  return (
    <div ref={slotRef} className={catalogueSlotClass(entry.size)}>
      {visible ? <CatalogueCard entry={entry} /> : null}
    </div>
  )
}
