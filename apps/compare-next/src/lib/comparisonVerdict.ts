import { computeWinners, formatSpecValue } from '@/lib/comparison'
import type { Item, SpecDefinition } from '@/types/catalogue'

export type ItemVerdict = {
  slug: string
  name: string
  score: number
  primaryWinCount: number
  pros: string[]
  tradeoffs: string[]
  cons: string[]
}

export type ComparisonVerdict = {
  primarySpecCount: number
  items: ItemVerdict[]
  summary: string
  faq: { question: string; answer: string }[]
}

function isComparableSpec(def: SpecDefinition): boolean {
  return def.valueType === 'number' && def.higherIsBetter !== null
}

function isPrimarySpec(def: SpecDefinition): boolean {
  return (
    isComparableSpec(def) &&
    def.comparisonRole === 'primary' &&
    def.comparisonWeight > 0
  )
}

function isTradeoffSpec(def: SpecDefinition): boolean {
  return isComparableSpec(def) && def.comparisonRole === 'tradeoff'
}

function formatDiff(
  def: SpecDefinition,
  winnerValue: number,
  loserValue: number,
  winnerName: string
): string {
  const winner = formatSpecValue(winnerValue, def)
  const loser = formatSpecValue(loserValue, def)
  const comparison = `vs ${winnerName}: ${winner}`

  if (loserValue === 0) return `${loser} (${comparison})`

  const baseline = Math.max(Math.abs(winnerValue), Math.abs(loserValue))
  const pct = Math.round((Math.abs(winnerValue - loserValue) / baseline) * 100)
  if (pct < def.minimumDifferencePercent) return `${loser} (${comparison})`

  const direction = loserValue > winnerValue ? 'higher' : 'lower'
  return `${loser} (${pct}% ${direction}; ${comparison})`
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
        ? `${winner.name} has the higher weighted primary-spec score, but the best pick still depends on your budget and use case.`
        : `Neither card wins clearly on the weighted primary specs — compare the table above for the details that matter to your build.`
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

function formatItemNames(items: Item[]): string {
  const names = items.map((item) => item.name)
  if (names.length < 3) return names.join(' and ')

  return `${names.slice(0, -1).join(', ')}, and ${names.at(-1)}`
}

/** Derive a per-pair verdict from each kind's configured spec profile. */
export function buildComparisonVerdict(
  items: Item[],
  specs: SpecDefinition[]
): ComparisonVerdict | null {
  if (items.length < 2) return null

  const primarySpecs = specs.filter(isPrimarySpec)
  if (primarySpecs.length === 0) return null

  const tradeoffSpecs = specs.filter(isTradeoffSpec)

  const verdicts: ItemVerdict[] = items.map((item) => ({
    slug: item.slug,
    name: item.name,
    score: 0,
    primaryWinCount: 0,
    pros: [],
    tradeoffs: [],
    cons: []
  }))
  const verdictBySlug = new Map(verdicts.map((entry) => [entry.slug, entry]))

  for (const def of [...primarySpecs, ...tradeoffSpecs]) {
    const winners = computeWinners(items, def)
    if (winners.size === 0) continue

    for (const winnerSlug of winners) {
      const entry = verdictBySlug.get(winnerSlug)
      if (entry) {
        if (def.comparisonRole === 'primary') {
          entry.score += def.comparisonWeight
          entry.primaryWinCount += 1
        }

        const advantages =
          def.comparisonRole === 'primary' ? entry.pros : entry.tradeoffs
        if (advantages.length < 3) {
          advantages.push(
            `${def.label}: ${formatSpecValue(items.find((i) => i.slug === winnerSlug)!.specs[def.key], def)}`
          )
        }
      }
    }

    if (
      def.comparisonRole === 'primary' &&
      winners.size === 1 &&
      items.length === 2
    ) {
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
          `${def.label}: ${formatDiff(
            def,
            winnerValue,
            loserValue,
            winner.name
          )}`
        )
      }
    }
  }

  const sorted = [...verdicts].sort((a, b) => b.score - a.score)
  const leader = sorted[0]
  const runnerUp = sorted[1]
  const priceNote = items.length === 2 ? priceDiffNote(items) : null

  let summary: string
  if (!runnerUp || leader.score === runnerUp.score) {
    summary = `${formatItemNames(items)} are tied on the ${primarySpecs.length} weighted primary specs — compare their trade-offs for the right fit.`
  } else {
    summary = `${leader.name} leads ${runnerUp.name} ${leader.score}–${runnerUp.score} on the ${primarySpecs.length} weighted primary specs${priceNote ?? ''}.`
  }

  return {
    primarySpecCount: primarySpecs.length,
    items: verdicts,
    summary,
    faq: buildFaq(
      items,
      specs,
      leader.score > (runnerUp?.score ?? 0) ? leader : null
    )
  }
}
