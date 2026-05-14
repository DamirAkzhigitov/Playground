const CF_GRAPHQL = 'https://api.cloudflare.com/client/v4/graphql'
const COMPARE_STATS_DEFAULT = 'https://compare.da-mr.com/api/stats'

const HOSTS = {
  resume: 'resume.da-mr.com',
  compare: 'compare.da-mr.com'
} as const

type StatsJson = {
  views: { resume: number | null; compare: number | null }
  users: { compare: number | null }
}

function jsonResponse(body: StatsJson, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    }
  })
}

async function fetchHostVisits(
  token: string,
  zoneId: string,
  hostname: string,
  datetimeGte: string,
  datetimeLt: string
): Promise<number | null> {
  const query = `
    query HostVisits($zoneTag: string!, $filter: ZoneHttpRequestsAdaptiveGroupsFilter_InputObject!) {
      viewer {
        zones(filter: { zoneTag: $zoneTag }) {
          httpRequestsAdaptiveGroups(limit: 10000, filter: $filter) {
            sum {
              visits
            }
          }
        }
      }
    }
  `

  const res = await fetch(CF_GRAPHQL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({
      query,
      variables: {
        zoneTag: zoneId,
        filter: {
          datetime_geq: datetimeGte,
          datetime_lt: datetimeLt,
          clientRequestHTTPHost: hostname,
          requestSource: 'eyeball'
        }
      }
    })
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    console.error(
      '[stats] GraphQL HTTP error',
      hostname,
      res.status,
      errText.slice(0, 500)
    )
    return null
  }

  const payload = (await res.json()) as {
    errors?: Array<{ message?: string }>
    data?: {
      viewer?: {
        zones?: Array<{
          httpRequestsAdaptiveGroups?: Array<{
            sum?: { visits?: number | null }
          }>
        }>
      }
    }
  }

  if (Array.isArray(payload.errors) && payload.errors.length > 0) {
    console.error(
      '[stats] GraphQL errors',
      hostname,
      payload.errors.map((e) => e.message).join('; ')
    )
    return null
  }

  const zones = payload.data?.viewer?.zones
  if (!zones || zones.length === 0) {
    console.error(
      '[stats] no zones returned — check CF_ZONE_ID matches the da-mr.com zone'
    )
    return null
  }

  const groups = zones[0]?.httpRequestsAdaptiveGroups ?? []
  let total = 0
  for (const g of groups) {
    const v = g.sum?.visits
    if (typeof v === 'number' && Number.isFinite(v)) total += v
  }
  return total
}

/** Zone analytics GraphQL often allows at most a 1d window per query; sum several sub-1d slices. */
async function fetchHostVisitsRolling(
  token: string,
  zoneId: string,
  hostname: string,
  sliceHours: number,
  sliceCount: number
): Promise<number | null> {
  const sliceMs = sliceHours * 60 * 60 * 1000
  const now = Date.now()
  const windows = Array.from({ length: sliceCount }, (_, i) => ({
    datetimeGte: new Date(now - (i + 1) * sliceMs).toISOString(),
    datetimeLt: new Date(now - i * sliceMs).toISOString()
  }))

  const results = await Promise.all(
    windows.map((w) =>
      fetchHostVisits(token, zoneId, hostname, w.datetimeGte, w.datetimeLt)
    )
  )

  if (results.some((r) => r === null)) return null
  const visits = results as number[]
  return visits.reduce((sum, r) => sum + r, 0)
}

function parseUserCount(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number.parseInt(value, 10)
    return Number.isNaN(n) ? null : n
  }
  return null
}

async function fetchCompareUserCount(
  compareStatsUrl: string
): Promise<number | null> {
  try {
    const res = await fetch(compareStatsUrl, {
      headers: { Accept: 'application/json' }
    })
    if (!res.ok) return null
    const body = (await res.json()) as { userCount?: unknown }
    return parseUserCount(body.userCount)
  } catch {
    return null
  }
}

export const onRequestGet: PagesFunction<{
  CF_API_TOKEN?: string
  CF_ZONE_ID?: string
  /** Override default production URL (e.g. https://dev-compare.da-mr.com/api/stats for dev Pages). */
  COMPARE_STATS_URL?: string
}> = async (context) => {
  const token = context.env.CF_API_TOKEN
  const zoneId = context.env.CF_ZONE_ID
  const compareStatsUrl =
    context.env.COMPARE_STATS_URL?.trim() || COMPARE_STATS_DEFAULT

  // Each GraphQL request must stay within Cloudflare's max window (often 1d);
  // sum several back-to-back sub-1d slices for a rolling ~week of visits.
  const sliceHours = 23
  const sliceCount = 7

  const [resumeViews, compareViews, userCount] = await Promise.all([
    token && zoneId
      ? fetchHostVisitsRolling(
          token,
          zoneId,
          HOSTS.resume,
          sliceHours,
          sliceCount
        )
      : Promise.resolve(null),
    token && zoneId
      ? fetchHostVisitsRolling(
          token,
          zoneId,
          HOSTS.compare,
          sliceHours,
          sliceCount
        )
      : Promise.resolve(null),
    fetchCompareUserCount(compareStatsUrl)
  ])

  return jsonResponse({
    views: { resume: resumeViews, compare: compareViews },
    users: { compare: userCount }
  })
}
