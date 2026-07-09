import Link from 'next/link'
import { Fragment } from 'react'

import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { computeWinners, formatSpecValue, itemPath } from '@/lib/comparison'
import { buildComparisonVerdict } from '@/lib/comparisonVerdict'
import { EN } from '@/i18n/messages'
import { cn } from '@/lib/utils'
import type { Item, SpecDefinition } from '@/types/catalogue'

type ComparisonTableProps = {
  items: Item[]
  specs: SpecDefinition[]
  kindSlug: string
}

type SpecGroup = {
  label: string | null
  defs: SpecDefinition[]
}

/** Overall column ranking: 1 = winner, 2 = runner-up (only when 3+ items are compared). */
type ColumnPlace = 1 | 2

const PLACE_BADGE_VARIANT: Record<ColumnPlace, 'default' | 'secondary'> = {
  1: 'default',
  2: 'secondary'
}

const PLACE_LABEL: Record<ColumnPlace, string> = {
  1: EN['comparison.winner'],
  2: EN['comparison.runnerUp']
}

function groupSpecs(specs: SpecDefinition[]): SpecGroup[] {
  const groups: SpecGroup[] = []
  const index = new Map<string, SpecGroup>()

  for (const def of specs) {
    const key = def.group ?? ''
    let group = index.get(key)
    if (!group) {
      group = { label: def.group, defs: [] }
      index.set(key, group)
      groups.push(group)
    }
    group.defs.push(def)
  }

  return groups
}

/**
 * Rank items by their overall verdict score so the winning column (and, for
 * 3+ items, the runner-up column) can be framed with a border. Ties at the
 * top score are left unmarked since there is no single winner to highlight.
 */
function computeColumnPlaces(
  items: Item[],
  specs: SpecDefinition[]
): Map<string, ColumnPlace> {
  const places = new Map<string, ColumnPlace>()
  const verdict = buildComparisonVerdict(items, specs)
  if (!verdict) return places

  const scoreBySlug = new Map(
    verdict.items.map((entry) => [entry.slug, entry.score])
  )
  const uniqueScores = Array.from(new Set(scoreBySlug.values())).sort(
    (a, b) => b - a
  )
  if (uniqueScores.length < 2) return places

  const [topScore, secondScore] = uniqueScores
  for (const item of items) {
    const score = scoreBySlug.get(item.slug)
    if (score === topScore) places.set(item.slug, 1)
    else if (score === secondScore && items.length > 2) places.set(item.slug, 2)
  }

  return places
}

/** Border classes that frame a winner/runner-up column; the winner's border is heavier. */
function columnFrameClasses(
  place: ColumnPlace | undefined,
  position: 'head' | 'body' | 'bodyEnd'
): string {
  if (!place) return ''

  const isWinner = place === 1
  const color = isWinner ? 'border-primary' : 'border-primary/35'
  const sideX = isWinner ? 'border-x-2' : 'border-x'
  const top =
    position === 'head'
      ? cn('rounded-t-md', isWinner ? 'border-t-2' : 'border-t')
      : ''
  const bottom =
    position === 'bodyEnd'
      ? cn('rounded-b-md', isWinner ? 'border-b-2' : 'border-b')
      : ''

  return cn(sideX, color, top, bottom)
}

export function ComparisonTable({
  items,
  specs,
  kindSlug
}: ComparisonTableProps) {
  const groups = groupSpecs(specs)
  const winnersByKey = new Map<string, Set<string>>(
    specs.map((def) => [def.key, computeWinners(items, def)])
  )
  const places = computeColumnPlaces(items, specs)
  const lastSpecKey = specs.at(-1)?.key

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead scope="col" className="w-48 whitespace-normal">
              {EN['comparison.specColumn']}
            </TableHead>
            {items.map((item) => {
              const place = places.get(item.slug)
              return (
                <TableHead
                  scope="col"
                  key={item.slug}
                  className={cn(
                    'whitespace-normal',
                    columnFrameClasses(place, 'head')
                  )}
                >
                  {place ? (
                    <Badge
                      variant={PLACE_BADGE_VARIANT[place]}
                      className="mb-2"
                    >
                      {PLACE_LABEL[place]}
                    </Badge>
                  ) : null}
                  {item.imageUrl ? (
                    <img
                      className="mb-1 h-18 w-32 max-w-32 rounded-sm object-cover"
                      src={item.imageUrl}
                      alt={item.name}
                      loading="lazy"
                    />
                  ) : null}
                  <span className="block font-bold text-foreground">
                    <Link href={itemPath(kindSlug, item.slug)}>
                      {item.name}
                    </Link>
                  </span>
                  {item.brand ? (
                    <span className="block text-xs font-medium text-muted-foreground">
                      {item.brand}
                    </span>
                  ) : null}
                </TableHead>
              )
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {groups.map((group, groupIndex) => (
            <Fragment key={group.label ?? `group-${groupIndex}`}>
              {group.label ? (
                <TableRow className="hover:bg-transparent">
                  <TableHead
                    scope="colgroup"
                    colSpan={items.length + 1}
                    className="bg-muted text-xs font-bold tracking-wide text-muted-foreground uppercase"
                  >
                    {group.label}
                  </TableHead>
                </TableRow>
              ) : null}
              {group.defs.map((def) => {
                const winners = winnersByKey.get(def.key) ?? new Set<string>()
                const rowPosition = def.key === lastSpecKey ? 'bodyEnd' : 'body'
                return (
                  <TableRow key={def.key}>
                    <TableHead
                      scope="row"
                      className="font-medium text-muted-foreground"
                    >
                      {def.label}
                    </TableHead>
                    {items.map((item) => {
                      const isWinner = winners.has(item.slug)
                      const place = places.get(item.slug)
                      return (
                        <TableCell
                          key={item.slug}
                          className={cn(
                            'whitespace-normal',
                            isWinner &&
                              'bg-primary/10 font-bold ring-1 ring-inset ring-primary/30',
                            columnFrameClasses(place, rowPosition)
                          )}
                        >
                          {formatSpecValue(item.specs[def.key] ?? null, def)}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                )
              })}
            </Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
