import { describe, expect, it } from 'vitest'

import { catalogueMetadata } from '@/lib/catalogueMetadata'
import { SITE_NAME } from '@/lib/site'

describe('catalogueMetadata', () => {
  it('uses short titles so the layout template adds the site suffix once', () => {
    const metadata = catalogueMetadata({ sort: 'hot' })

    expect(metadata.title).toBe('Hot comparisons')
    expect(metadata.openGraph?.title).toBe(`Hot comparisons | ${SITE_NAME}`)
    expect(metadata.twitter?.title).toBe(`Hot comparisons | ${SITE_NAME}`)
  })

  it('uses the home copy key on the root route', () => {
    const metadata = catalogueMetadata({ sort: 'new', isHome: true })

    expect(metadata.title).toBe(`Compare catalogue | ${SITE_NAME}`)
    expect(metadata.alternates?.canonical).toBe('/')
  })
})
