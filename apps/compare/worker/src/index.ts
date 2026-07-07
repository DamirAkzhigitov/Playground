import {
  createSessionMiddleware,
  mountAuthHandler,
  requireAuth
} from '@playground/auth-core'
import { Hono } from 'hono'
import { z } from 'zod'
import { getAuth } from './auth'
import { ensureCompareAppUser } from './ensure-app-user'
import type { AppEnv } from './types'
import { itemTypes } from './routes/item-types'
import { typeTemplate } from './routes/type-template'
import { items } from './routes/items'
import { compareGroups } from './routes/compare-groups'
import { answers } from './routes/answers'
import { photos } from './routes/photos'
import { exports_ } from './routes/exports'
import { profile } from './routes/profile'

const app = new Hono<AppEnv>()

function isPublicApiPath(path: string, method: string): boolean {
  if (path === '/api/health' || path.startsWith('/api/auth')) {
    return true
  }
  if (method === 'GET') {
    if (path === '/api/item-types') return true
    if (/^\/api\/item-types\/[^/]+\/template$/.test(path)) return true
    if (path === '/api/compare-groups/public') return true
    if (/^\/api\/compare-groups\/[^/]+\/view$/.test(path)) return true
    if (/^\/api\/items\/[^/]+$/.test(path) && path !== '/api/items') return true
    if (path.startsWith('/api/photos/')) return true
  }
  return false
}

app.get('/api/health', (c) => c.json({ ok: true }))

app.use('/api/*', createSessionMiddleware(getAuth))
mountAuthHandler(app, getAuth)

app.use('/api/*', async (c, next) => {
  if (isPublicApiPath(c.req.path, c.req.method)) {
    return next()
  }
  const userId = c.get('userId')
  if (userId) {
    await ensureCompareAppUser(c)
  }
  return requireAuth(c, next)
})

app.route('/api/item-types', itemTypes)
app.route('/api/item-types', typeTemplate)
app.route('/api/items', items)
app.route('/api/compare-groups', compareGroups)
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
