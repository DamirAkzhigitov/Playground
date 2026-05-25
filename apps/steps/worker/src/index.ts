import { Hono } from 'hono'
import { z } from 'zod'
import type { AppEnv } from './types'
import { requireAuth } from './middleware'
import { auth } from './auth'
import { actions } from './routes/actions'
import { enrollments } from './routes/enrollments'
import { contributorActions } from './routes/contributor-actions'

const app = new Hono<AppEnv>()

app.get('/api/health', (c) => c.json({ ok: true, service: 'steps-api' }))

app.route('/api/auth', auth)

// Public catalog browsing (no auth required)
app.route('/api/actions', actions)

// Everything else under /api requires auth (enrollments, contributor, future protected)
app.use('/api/*', async (c, next) => {
  const path = c.req.path
  if (
    path.startsWith('/api/auth') ||
    path === '/api/health' ||
    path.startsWith('/api/actions') // GET list + /:slug are public; mutations not hit here
  ) {
    return next()
  }
  return requireAuth(c, next)
})

app.route('/api/enrollments', enrollments)
app.route('/api/contributor/actions', contributorActions)

// Note: contributor routes internally re-check role; the above just ensures logged in.

app.onError((err, c) => {
  console.error(err)
  if (err instanceof z.ZodError) {
    return c.json({ error: 'Validation error', details: err.flatten() }, 400)
  }
  return c.json({ error: 'Internal server error' }, 500)
})

export default app
