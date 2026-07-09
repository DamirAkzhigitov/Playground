import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ComparisonVerdict } from '@/lib/comparisonVerdict'
import { ChevronRightIcon } from 'lucide-react'

type ComparisonVerdictProps = {
  verdict: ComparisonVerdict
}

function SpecList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
        {title}
      </h3>
      <ul className="py-2 text-sm marker:text-primary">
        {items.map((item, index) => (
          <li className="flex gap-2" key={`${title}-${index}`}>
            <ChevronRightIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function ComparisonVerdictBlock({ verdict }: ComparisonVerdictProps) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-background p-4">
      <p className="text-base leading-relaxed text-foreground">
        {verdict.summary}
      </p>
      <p className="text-sm text-muted-foreground">
        Overall scores use {verdict.primarySpecCount} weighted primary specs.
        Trade-off details do not change the overall score.
      </p>

      {verdict.items.length > 0 ? (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(14rem,1fr))] gap-4">
          {verdict.items.map((item) => (
            <Card key={item.slug} size="sm" className="bg-muted/40">
              <CardHeader>
                <CardTitle className="text-base font-bold">
                  {item.name}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {item.score} weighted points from {item.primaryWinCount}{' '}
                  primary {item.primaryWinCount === 1 ? 'win' : 'wins'}
                </p>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {item.pros.length > 0 ? (
                  <SpecList title="Primary advantages" items={item.pros} />
                ) : null}
                {item.tradeoffs.length > 0 ? (
                  <SpecList
                    title="Trade-off advantages"
                    items={item.tradeoffs}
                  />
                ) : null}
                {item.cons.length > 0 ? (
                  <SpecList title="Primary disadvantages" items={item.cons} />
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {verdict.faq.length > 0 ? (
        <div>
          <h2 className="mb-3 text-lg font-semibold">FAQ</h2>
          <dl className="flex flex-col gap-4">
            {verdict.faq.map((entry) => (
              <div key={entry.question}>
                <dt className="mb-1 font-semibold">{entry.question}</dt>
                <dd className="text-[0.9375rem] text-muted-foreground">
                  {entry.answer}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}
    </div>
  )
}
