import { Hono } from 'hono'
import type { AppEnv } from '../types'

const stats = new Hono<AppEnv>()

stats.get('/', async (c) => {
  const row = await c.env.DB.prepare(
    'SELECT COUNT(*) AS count FROM users'
  ).first<{ count: number | string }>()

  const raw = row?.count
  const userCount =
    typeof raw === 'number' ? raw : Number.parseInt(String(raw ?? '0'), 10) || 0

  return c.json({ userCount }, 200, {
    'Cache-Control': 'public, max-age=3600',
    'Access-Control-Allow-Origin': 'https://da-mr.com'
  })
})

export { stats }
