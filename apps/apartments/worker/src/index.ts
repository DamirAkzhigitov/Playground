import { Hono } from 'hono'
import { z } from 'zod'
import type { AppEnv } from './types'
import { requireAuth } from './middleware'
import { auth } from './auth'
import { categories } from './routes/categories'
import { questions } from './routes/questions'
import { apartments } from './routes/apartments'
import { answers } from './routes/answers'
import { photos } from './routes/photos'
import { exports_ } from './routes/exports'

const app = new Hono<AppEnv>()

app.get('/api/health', (c) => c.json({ ok: true }))

app.route('/api/auth', auth)

app.use('/api/*', async (c, next) => {
  if (c.req.path.startsWith('/api/auth') || c.req.path === '/api/health') {
    return next()
  }
  return requireAuth(c, next)
})

app.route('/api/categories', categories)
app.route('/api/questions', questions)
app.route('/api/apartments', apartments)
app.route('/api/answers', answers)
app.route('/api/photos', photos)
app.route('/api/export', exports_)

app.onError((err, c) => {
  console.error(err)
  if (err instanceof z.ZodError) {
    return c.json({ error: 'Validation error', details: err.flatten() }, 400)
  }
  return c.json({ error: 'Internal server error' }, 500)
})

export default app
