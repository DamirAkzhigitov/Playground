'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

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

  function toggle(slug: string) {
    setSelected((current) =>
      current.includes(slug)
        ? current.filter((s) => s !== slug)
        : [...current, slug]
    )
  }

  function compare() {
    if (selected.length < 2) return
    router.push(comparisonPath(kindSlug, selected))
  }

  return (
    <div className="hub-picker">
      <div className="hub-picker__grid">
        {items.map((item) => {
          const isSelected = selected.includes(item.slug)
          return (
            <button
              type="button"
              key={item.slug}
              className={
                isSelected
                  ? 'hub-picker__item hub-picker__item--selected'
                  : 'hub-picker__item'
              }
              aria-pressed={isSelected}
              onClick={() => toggle(item.slug)}
            >
              <span>
                <span className="hub-picker__item-name">{item.name}</span>
                {item.brand ? (
                  <span className="hub-picker__item-brand">{item.brand}</span>
                ) : null}
              </span>
            </button>
          )
        })}
      </div>

      <div className="hub-picker__bar">
        <span className="hub-picker__bar-hint">
          {selected.length < 2 ? t('hub.selectAtLeastTwo') : t('hub.pickHint')}
        </span>
        <button
          type="button"
          className="hub-picker__compare"
          onClick={compare}
          disabled={selected.length < 2}
        >
          {t('hub.compareSelected', { count: selected.length })}
        </button>
      </div>
    </div>
  )
}
