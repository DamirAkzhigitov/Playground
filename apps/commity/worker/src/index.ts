import { Hono } from 'hono'
import { z } from 'zod'
import type { AppEnv } from './types'
import { requireAuth } from './middleware'
import { auth } from './auth'
import { gmail } from './gmail/routes'
import { chat } from './routes/chat'

const app = new Hono<AppEnv>()

app.get('/api/health', (c) => c.json({ ok: true }))

app.route('/api/auth', auth)
app.route('/api/gmail', gmail)

app.use('/api/*', async (c, next) => {
  if (
    c.req.path.startsWith('/api/auth') ||
    c.req.path === '/api/health' ||
    c.req.path === '/api/gmail/callback'
  ) {
    return next()
  }
  return requireAuth(c, next)
})

app.route('/api/chat', chat)

app.onError((err, c) => {
  console.error(err)
  if (err instanceof z.ZodError) {
    return c.json({ error: 'Validation error', details: err.flatten() }, 400)
  }
  if (err instanceof Error && err.message) {
    return c.json({ error: err.message }, 502)
  }
  return c.json({ error: 'Internal server error' }, 500)
})

export default app
