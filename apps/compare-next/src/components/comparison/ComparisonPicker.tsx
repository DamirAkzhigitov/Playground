'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { XIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
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
  const [selectValue, setSelectValue] = useState<string | null>(null)

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

  function addSlug(slug: string | null) {
    if (!slug || currentSlugs.includes(slug)) return
    setSelectValue(null)
    navigate([...currentSlugs, slug])
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-background p-4">
      <div>
        <h2 className="text-base font-semibold">
          {t('comparison.pickerTitle')}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t('comparison.pickerHint')}
        </p>
      </div>

      <ul className="flex flex-wrap gap-2">
        {currentSlugs.map((slug) => (
          <li key={slug}>
            <Badge
              variant="secondary"
              className="h-7 gap-1 rounded-full pr-1 text-sm"
            >
              {nameBySlug.get(slug) ?? slug}
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="rounded-full"
                onClick={() => removeSlug(slug)}
                disabled={currentSlugs.length <= 2}
                aria-label={t('comparison.remove', {
                  name: nameBySlug.get(slug) ?? slug
                })}
              >
                <XIcon />
              </Button>
            </Badge>
          </li>
        ))}
      </ul>

      {available.length > 0 ? (
        <Select
          value={selectValue}
          onValueChange={(value) => addSlug(value as string | null)}
        >
          <SelectTrigger aria-label={t('comparison.addItem')} className="w-fit">
            <SelectValue placeholder={t('comparison.addItem')} />
          </SelectTrigger>
          <SelectContent>
            {available.map((item) => (
              <SelectItem key={item.slug} value={item.slug}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
    </div>
  )
}
