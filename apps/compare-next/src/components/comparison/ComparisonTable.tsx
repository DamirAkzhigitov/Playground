import Link from 'next/link'
import { Fragment } from 'react'

import { computeWinners, formatSpecValue, itemPath } from '@/lib/comparison'
import { EN } from '@/i18n/messages'
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
    <div className="cmp-table__scroll">
      <table className="cmp-table">
        <thead>
          <tr>
            <th scope="col" className="cmp-table__corner">
              {EN['comparison.specColumn']}
            </th>
            {items.map((item) => (
              <th scope="col" key={item.slug} className="cmp-table__item">
                {item.imageUrl ? (
                  <img
                    className="cmp-table__item-img"
                    src={item.imageUrl}
                    alt={item.name}
                    loading="lazy"
                  />
                ) : null}
                <span className="cmp-table__item-name">
                  <Link href={itemPath(kindSlug, item.slug)}>{item.name}</Link>
                </span>
                {item.brand ? (
                  <span className="cmp-table__item-brand">{item.brand}</span>
                ) : null}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {groups.map((group, groupIndex) => (
            <Fragment key={group.label ?? `group-${groupIndex}`}>
              {group.label ? (
                <tr className="cmp-table__group">
                  <th scope="colgroup" colSpan={items.length + 1}>
                    {group.label}
                  </th>
                </tr>
              ) : null}
              {group.defs.map((def) => {
                const winners = winnersByKey.get(def.key) ?? new Set<string>()
                return (
                  <tr key={def.key}>
                    <th scope="row" className="cmp-table__spec">
                      {def.label}
                    </th>
                    {items.map((item) => {
                      const isWinner = winners.has(item.slug)
                      return (
                        <td
                          key={item.slug}
                          className={
                            isWinner
                              ? 'cmp-table__value cmp-table__value--best'
                              : 'cmp-table__value'
                          }
                        >
                          {formatSpecValue(item.specs[def.key] ?? null, def)}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}
