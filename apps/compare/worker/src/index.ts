import {
  createSessionMiddleware,
  mountAuthHandler,
  requireAuth
} from '@playground/auth-core'
import { Hono } from 'hono'
import { z } from 'zod'
import { getAuth } from './auth'
import type { AppEnv } from './types'
import { categories } from './routes/categories'
import { questions } from './routes/questions'
import { listings } from './routes/listings'
import { answers } from './routes/answers'
import { photos } from './routes/photos'
import { exports_ } from './routes/exports'
import { profile } from './routes/profile'

const app = new Hono<AppEnv>()

app.get('/api/health', (c) => c.json({ ok: true }))

app.use('/api/*', createSessionMiddleware(getAuth))
mountAuthHandler(app, getAuth)

app.use('/api/*', async (c, next) => {
  if (c.req.path.startsWith('/api/auth') || c.req.path === '/api/health') {
    return next()
  }
  return requireAuth(c, next)
})

app.route('/api/categories', categories)
app.route('/api/questions', questions)
app.route('/api/listings', listings)
app.route('/api/answers', answers)
app.route('/api/photos', photos)
app.route('/api/export', exports_)
app.route('/api/profile', profile)

app.onError((err, c) => {
  console.error(err)
  if (err instanceof z.ZodError) {
    return c.json({ error: 'Validation error', details: err.flatten() }, 400)
  }
  return c.json({ error: 'Internal server error' }, 500)
})

export default app
