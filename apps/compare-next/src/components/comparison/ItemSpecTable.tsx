import { Fragment } from 'react'

import { formatSpecValue } from '@/lib/comparison'
import type { Item, SpecDefinition } from '@/types/catalogue'

type ItemSpecTableProps = {
  item: Item
  specs: SpecDefinition[]
}

function groupSpecs(specs: SpecDefinition[]) {
  const groups: { label: string | null; defs: SpecDefinition[] }[] = []
  const index = new Map<string, (typeof groups)[number]>()

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

export function ItemSpecTable({ item, specs }: ItemSpecTableProps) {
  const groups = groupSpecs(specs)

  return (
    <div className="item-specs__scroll">
      <table className="item-specs">
        <tbody>
          {groups.map((group, groupIndex) => (
            <Fragment key={group.label ?? `group-${groupIndex}`}>
              {group.label ? (
                <tr className="item-specs__group">
                  <th colSpan={2}>{group.label}</th>
                </tr>
              ) : null}
              {group.defs.map((def) => (
                <tr key={def.key}>
                  <th scope="row">{def.label}</th>
                  <td>{formatSpecValue(item.specs[def.key] ?? null, def)}</td>
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}
