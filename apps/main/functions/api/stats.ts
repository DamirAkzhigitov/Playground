const CF_GRAPHQL = 'https://api.cloudflare.com/client/v4/graphql'
const COMPARE_STATS = 'https://compare.da-mr.com/api/stats'

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
          httpRequestsAdaptiveGroups(limit: 1, filter: $filter) {
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

  if (!res.ok) return null

  const payload = (await res.json()) as {
    errors?: unknown
    data?: {
      viewer?: {
        zones?: Array<{
          httpRequestsAdaptiveGroups?: Array<{ sum?: { visits?: number } }>
        }>
      }
    }
  }

  if (Array.isArray(payload.errors) && payload.errors.length > 0) return null

  const visits =
    payload.data?.viewer?.zones?.[0]?.httpRequestsAdaptiveGroups?.[0]?.sum
      ?.visits

  return typeof visits === 'number' ? visits : null
}

async function fetchCompareUserCount(): Promise<number | null> {
  try {
    const res = await fetch(COMPARE_STATS, {
      headers: { Accept: 'application/json' }
    })
    if (!res.ok) return null
    const body = (await res.json()) as { userCount?: unknown }
    const n = body.userCount
    return typeof n === 'number' ? n : null
  } catch {
    return null
  }
}

export const onRequestGet: PagesFunction<{
  CF_API_TOKEN?: string
  CF_ZONE_ID?: string
}> = async (context) => {
  const token = context.env.CF_API_TOKEN
  const zoneId = context.env.CF_ZONE_ID

  const now = new Date()
  const datetimeLt = now.toISOString()
  const datetimeGte = new Date(
    now.getTime() - 10 * 365 * 24 * 60 * 60 * 1000
  ).toISOString()

  const [resumeViews, compareViews, userCount] = await Promise.all([
    token && zoneId
      ? fetchHostVisits(token, zoneId, HOSTS.resume, datetimeGte, datetimeLt)
      : Promise.resolve(null),
    token && zoneId
      ? fetchHostVisits(token, zoneId, HOSTS.compare, datetimeGte, datetimeLt)
      : Promise.resolve(null),
    fetchCompareUserCount()
  ])

  return jsonResponse({
    views: { resume: resumeViews, compare: compareViews },
    users: { compare: userCount }
  })
}
