import Link from 'next/link'
import { Fragment } from 'react'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { computeWinners, formatSpecValue, itemPath } from '@/lib/comparison'
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

export function ComparisonTable({
  items,
  specs,
  kindSlug
}: ComparisonTableProps) {
  const groups = groupSpecs(specs)
  const winnersByKey = new Map<string, Set<string>>(
    specs.map((def) => [def.key, computeWinners(items, def)])
  )

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead scope="col" className="w-48 whitespace-normal">
              {EN['comparison.specColumn']}
            </TableHead>
            {items.map((item) => (
              <TableHead
                scope="col"
                key={item.slug}
                className="whitespace-normal"
              >
                {item.imageUrl ? (
                  <img
                    className="mb-1 h-18 w-32 max-w-32 rounded-sm object-cover"
                    src={item.imageUrl}
                    alt={item.name}
                    loading="lazy"
                  />
                ) : null}
                <span className="block font-bold text-foreground">
                  <Link href={itemPath(kindSlug, item.slug)}>{item.name}</Link>
                </span>
                {item.brand ? (
                  <span className="block text-xs font-medium text-muted-foreground">
                    {item.brand}
                  </span>
                ) : null}
              </TableHead>
            ))}
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
                      return (
                        <TableCell
                          key={item.slug}
                          className={cn(
                            'whitespace-normal',
                            isWinner &&
                              'bg-primary/10 font-bold text-primary ring-1 ring-inset ring-primary/30'
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
