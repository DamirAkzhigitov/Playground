import { computeWinners, formatSpecValue } from '@/lib/comparison'
import type { Item, SpecDefinition } from '@/types/catalogue'

export type ItemVerdict = {
  slug: string
  name: string
  winCount: number
  pros: string[]
  cons: string[]
}

export type ComparisonVerdict = {
  rankedSpecCount: number
  items: ItemVerdict[]
  summary: string
  faq: { question: string; answer: string }[]
}

function isRankedSpec(def: SpecDefinition): boolean {
  return def.valueType === 'number' && def.higherIsBetter !== null
}

function formatDiff(
  def: SpecDefinition,
  winnerValue: number,
  loserValue: number
): string {
  if (loserValue === 0) return formatSpecValue(winnerValue, def)

  const pct = Math.round(
    (Math.abs(winnerValue - loserValue) / Math.abs(loserValue)) * 100
  )
  if (pct < 5) return formatSpecValue(winnerValue, def)

  const direction = winnerValue > loserValue ? 'more' : 'less'
  return `${formatSpecValue(winnerValue, def)} (${pct}% ${direction})`
}

function priceDiffNote(items: Item[]): string | null {
  const prices = items
    .map((item) => item.specs.msrp_usd)
    .filter((value): value is number => typeof value === 'number')

  if (prices.length < 2) return null

  const diff = Math.abs(prices[0] - prices[1])
  if (diff < 25) return null

  const cheaper = prices[0] < prices[1] ? items[0] : items[1]
  return `, with a $${diff.toLocaleString('en-US')} MSRP gap favoring ${cheaper.name}`
}

function buildFaq(
  items: Item[],
  specs: SpecDefinition[],
  winner: ItemVerdict | null
): { question: string; answer: string }[] {
  const faq: { question: string; answer: string }[] = []

  if (items.length === 2) {
    const [a, b] = items
    faq.push({
      question: `Is ${a.name} better than ${b.name}?`,
      answer: winner
        ? `${winner.name} leads on ${winner.winCount} of the ranked specs we compare, but the best pick depends on your budget and use case.`
        : `Neither card wins clearly across ranked specs — compare the table above for the workloads you care about.`
    })
  }

  const vramDef = specs.find((def) => def.key === 'vram_gb')
  if (vramDef && items.length === 2) {
    const [a, b] = items
    const aVram = a.specs.vram_gb
    const bVram = b.specs.vram_gb
    if (typeof aVram === 'number' && typeof bVram === 'number') {
      const leader = aVram >= bVram ? a : b
      faq.push({
        question: `Which has more VRAM?`,
        answer: `${leader.name} has ${formatSpecValue(leader.specs.vram_gb, vramDef)} versus ${formatSpecValue(leader === a ? bVram : aVram, vramDef)}.`
      })
    }
  }

  return faq
}

/** Derive a per-pair verdict, pros/cons, and FAQ from spec winners. */
export function buildComparisonVerdict(
  items: Item[],
  specs: SpecDefinition[]
): ComparisonVerdict | null {
  if (items.length < 2) return null

  const rankedSpecs = specs.filter(isRankedSpec)
  if (rankedSpecs.length === 0) return null

  const verdicts: ItemVerdict[] = items.map((item) => ({
    slug: item.slug,
    name: item.name,
    winCount: 0,
    pros: [],
    cons: []
  }))
  const verdictBySlug = new Map(verdicts.map((entry) => [entry.slug, entry]))

  for (const def of rankedSpecs) {
    const winners = computeWinners(items, def)
    if (winners.size === 0) continue

    for (const winnerSlug of winners) {
      const entry = verdictBySlug.get(winnerSlug)
      if (entry) {
        entry.winCount += 1
        if (entry.pros.length < 3) {
          entry.pros.push(
            `${def.label}: ${formatSpecValue(items.find((i) => i.slug === winnerSlug)!.specs[def.key], def)}`
          )
        }
      }
    }

    if (winners.size === 1 && items.length === 2) {
      const winnerSlug = [...winners][0]
      const loser = items.find((item) => item.slug !== winnerSlug)
      const winner = items.find((item) => item.slug === winnerSlug)
      if (!loser || !winner) continue

      const loserEntry = verdictBySlug.get(loser.slug)
      const winnerValue = winner.specs[def.key]
      const loserValue = loser.specs[def.key]
      if (
        loserEntry &&
        loserEntry.cons.length < 3 &&
        typeof winnerValue === 'number' &&
        typeof loserValue === 'number'
      ) {
        loserEntry.cons.push(
          `${def.label}: ${formatDiff(def, winnerValue, loserValue)} (vs ${formatSpecValue(loserValue, def)})`
        )
      }
    }
  }

  const sorted = [...verdicts].sort((a, b) => b.winCount - a.winCount)
  const leader = sorted[0]
  const runnerUp = sorted[1]
  const priceNote = items.length === 2 ? priceDiffNote(items) : null

  let summary: string
  if (!runnerUp || leader.winCount === runnerUp.winCount) {
    summary = `${items.map((item) => item.name).join(' and ')} trade wins across ${rankedSpecs.length} ranked specs — check the table for the details that matter to your build.`
  } else {
    summary = `${leader.name} wins ${leader.winCount} of ${rankedSpecs.length} ranked specs against ${runnerUp.name}${priceNote ?? ''}.`
  }

  return {
    rankedSpecCount: rankedSpecs.length,
    items: verdicts,
    summary,
    faq: buildFaq(
      items,
      specs,
      leader.winCount > (runnerUp?.winCount ?? 0) ? leader : null
    )
  }
}
