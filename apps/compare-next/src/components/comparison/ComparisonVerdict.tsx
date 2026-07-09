import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ComparisonVerdict } from '@/lib/comparisonVerdict'

type ComparisonVerdictProps = {
  verdict: ComparisonVerdict
}

export function ComparisonVerdictBlock({ verdict }: ComparisonVerdictProps) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-background p-4">
      <p className="text-base leading-relaxed text-foreground">
        {verdict.summary}
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
                  {item.winCount} of {verdict.rankedSpecCount} ranked specs
                </p>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {item.pros.length > 0 ? (
                  <div>
                    <h3 className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
                      Pros
                    </h3>
                    <ul className="ml-4.5 list-disc text-sm marker:text-primary">
                      {item.pros.map((pro) => (
                        <li key={pro}>{pro}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {item.cons.length > 0 ? (
                  <div>
                    <h3 className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
                      Cons
                    </h3>
                    <ul className="ml-4.5 list-disc text-sm marker:text-destructive">
                      {item.cons.map((con) => (
                        <li key={con}>{con}</li>
                      ))}
                    </ul>
                  </div>
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
