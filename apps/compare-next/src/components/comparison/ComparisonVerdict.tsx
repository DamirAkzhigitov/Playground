import type { ComparisonVerdict } from '@/lib/comparisonVerdict'

type ComparisonVerdictProps = {
  verdict: ComparisonVerdict
}

export function ComparisonVerdictBlock({ verdict }: ComparisonVerdictProps) {
  return (
    <div className="cmp-verdict">
      <p className="cmp-verdict__summary">{verdict.summary}</p>

      {verdict.items.length > 0 ? (
        <div className="cmp-verdict__grid">
          {verdict.items.map((item) => (
            <div key={item.slug} className="cmp-verdict__card">
              <h2 className="cmp-verdict__name">{item.name}</h2>
              <p className="cmp-verdict__score">
                {item.winCount} of {verdict.rankedSpecCount} ranked specs
              </p>
              {item.pros.length > 0 ? (
                <div>
                  <h3 className="cmp-verdict__label">Pros</h3>
                  <ul className="cmp-verdict__list cmp-verdict__list--pros">
                    {item.pros.map((pro) => (
                      <li key={pro}>{pro}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {item.cons.length > 0 ? (
                <div>
                  <h3 className="cmp-verdict__label">Cons</h3>
                  <ul className="cmp-verdict__list cmp-verdict__list--cons">
                    {item.cons.map((con) => (
                      <li key={con}>{con}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {verdict.faq.length > 0 ? (
        <div className="cmp-faq">
          <h2 className="cmp-faq__title">FAQ</h2>
          <dl className="cmp-faq__list">
            {verdict.faq.map((entry) => (
              <div key={entry.question} className="cmp-faq__item">
                <dt className="cmp-faq__question">{entry.question}</dt>
                <dd className="cmp-faq__answer">{entry.answer}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}
    </div>
  )
}
