'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useI18n } from '@/contexts/I18nContext'
import { comparisonPath } from '@/lib/comparison'

type HubPickerItem = {
  slug: string
  name: string
  brand: string | null
}

type HubPickerProps = {
  kindSlug: string
  items: HubPickerItem[]
}

export function HubPicker({ kindSlug, items }: HubPickerProps) {
  const router = useRouter()
  const { t } = useI18n()
  const [selected, setSelected] = useState<string[]>([])

  function compare() {
    if (selected.length < 2) return
    router.push(comparisonPath(kindSlug, selected))
  }

  return (
    <div className="flex flex-col gap-4">
      <ToggleGroup
        multiple
        value={selected}
        onValueChange={setSelected}
        variant="outline"
        spacing={2}
        className="grid w-full grid-cols-[repeat(auto-fill,minmax(14rem,1fr))]"
      >
        {items.map((item) => (
          <ToggleGroupItem
            key={item.slug}
            value={item.slug}
            className="h-auto flex-col items-start gap-0.5 rounded-md px-3 py-3 text-left"
          >
            <span className="font-semibold">{item.name}</span>
            {item.brand ? (
              <span className="text-xs text-muted-foreground">
                {item.brand}
              </span>
            ) : null}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <div className="sticky bottom-4 flex items-center justify-between gap-4 rounded-lg border border-border bg-background p-4 shadow-md">
        <span className="text-sm text-muted-foreground">
          {selected.length < 2 ? t('hub.selectAtLeastTwo') : t('hub.pickHint')}
        </span>
        <Button onClick={compare} disabled={selected.length < 2}>
          {t('hub.compareSelected', { count: selected.length })}
        </Button>
      </div>
    </div>
  )
}
