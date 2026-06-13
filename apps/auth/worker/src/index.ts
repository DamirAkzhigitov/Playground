import {
  createSessionMiddleware,
  mountAuthHandler
} from '@playground/auth-core'
import { Hono } from 'hono'
import { getAuth } from './auth'
import type { AppEnv } from './types'

const app = new Hono<AppEnv>()

app.get('/api/health', (c) =>
  c.json({ ok: true, service: 'playground-auth-api' })
)

app.use('/api/*', createSessionMiddleware(getAuth))
mountAuthHandler(app, getAuth)

export default app
