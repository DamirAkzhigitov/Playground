import {
  createSessionMiddleware,
  mountAuthHandler,
  requireAuth
} from '@playground/auth-core'
import { Hono } from 'hono'
import { z } from 'zod'
import { getAuth } from './auth'
import type { AppEnv } from './types'
import { actions } from './routes/actions'
import { enrollments } from './routes/enrollments'
import { contributorActions } from './routes/contributor-actions'

const app = new Hono<AppEnv>()

app.get('/api/health', (c) => c.json({ ok: true, service: 'steps-api' }))

app.use('/api/*', createSessionMiddleware(getAuth))
mountAuthHandler(app, getAuth)

app.route('/api/actions', actions)

app.use('/api/*', async (c, next) => {
  const path = c.req.path
  if (
    path.startsWith('/api/auth') ||
    path === '/api/health' ||
    path.startsWith('/api/actions')
  ) {
    return next()
  }
  return requireAuth(c, next)
})

app.route('/api/enrollments', enrollments)
app.route('/api/contributor/actions', contributorActions)

app.onError((err, c) => {
  console.error(err)
  if (err instanceof z.ZodError) {
    return c.json({ error: 'Validation error', details: err.flatten() }, 400)
  }
  return c.json({ error: 'Internal server error' }, 500)
})

export default app
