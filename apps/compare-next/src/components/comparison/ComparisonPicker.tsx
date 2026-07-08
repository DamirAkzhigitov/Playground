'use client'

import { useRouter } from 'next/navigation'
import { useMemo } from 'react'

import { useI18n } from '@/contexts/I18nContext'
import { comparisonPath } from '@/lib/comparison'

type PickerItem = {
  slug: string
  name: string
}

type ComparisonPickerProps = {
  kindSlug: string
  currentSlugs: string[]
  allItems: PickerItem[]
}

export function ComparisonPicker({
  kindSlug,
  currentSlugs,
  allItems
}: ComparisonPickerProps) {
  const router = useRouter()
  const { t } = useI18n()

  const nameBySlug = useMemo(
    () => new Map(allItems.map((item) => [item.slug, item.name])),
    [allItems]
  )

  const available = useMemo(
    () => allItems.filter((item) => !currentSlugs.includes(item.slug)),
    [allItems, currentSlugs]
  )

  function navigate(slugs: string[]) {
    router.push(comparisonPath(kindSlug, slugs))
  }

  function removeSlug(slug: string) {
    if (currentSlugs.length <= 2) return
    navigate(currentSlugs.filter((current) => current !== slug))
  }

  function addSlug(slug: string) {
    if (!slug || currentSlugs.includes(slug)) return
    navigate([...currentSlugs, slug])
  }

  return (
    <div className="cmp-picker">
      <div className="cmp-picker__head">
        <h2 className="cmp-picker__title">{t('comparison.pickerTitle')}</h2>
        <p className="cmp-picker__hint">{t('comparison.pickerHint')}</p>
      </div>

      <ul className="cmp-picker__chips">
        {currentSlugs.map((slug) => (
          <li key={slug} className="cmp-picker__chip">
            <span>{nameBySlug.get(slug) ?? slug}</span>
            <button
              type="button"
              className="cmp-picker__chip-remove"
              onClick={() => removeSlug(slug)}
              disabled={currentSlugs.length <= 2}
              aria-label={t('comparison.remove', {
                name: nameBySlug.get(slug) ?? slug
              })}
            >
              ×
            </button>
          </li>
        ))}
      </ul>

      {available.length > 0 ? (
        <label className="cmp-picker__add">
          <span className="visually-hidden">{t('comparison.addItem')}</span>
          <select
            className="cmp-picker__select"
            value=""
            onChange={(event) => addSlug(event.target.value)}
          >
            <option value="" disabled>
              {t('comparison.addItem')}
            </option>
            {available.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}
    </div>
  )
}
