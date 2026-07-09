import { Fragment } from 'react'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow
} from '@/components/ui/table'
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
    <div className="overflow-hidden rounded-lg border border-border">
      <Table>
        <TableBody>
          {groups.map((group, groupIndex) => (
            <Fragment key={group.label ?? `group-${groupIndex}`}>
              {group.label ? (
                <TableRow className="hover:bg-transparent">
                  <TableHead
                    colSpan={2}
                    className="bg-muted text-xs font-bold tracking-wide text-muted-foreground uppercase"
                  >
                    {group.label}
                  </TableHead>
                </TableRow>
              ) : null}
              {group.defs.map((def) => (
                <TableRow key={def.key}>
                  <TableHead
                    scope="row"
                    className="w-2/5 font-normal text-muted-foreground"
                  >
                    {def.label}
                  </TableHead>
                  <TableCell className="whitespace-normal">
                    {formatSpecValue(item.specs[def.key] ?? null, def)}
                  </TableCell>
                </TableRow>
              ))}
            </Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
