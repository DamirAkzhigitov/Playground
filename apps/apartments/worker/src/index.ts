import { Hono } from 'hono'
import { cors } from 'hono/cors'

type Bindings = {
  DB: D1Database
  PHOTOS: R2Bucket
}

const app = new Hono<{ Bindings: Bindings }>()

app.use(
  '/api/*',
  cors({
    origin: ['http://localhost:3002', 'https://apartments.da-mr.com'],
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE']
  })
)

app.get('/api/health', (c) => c.json({ ok: true }))

app.onError((err, c) => {
  console.error(err)
  return c.json({ error: err.message }, 500)
})

export default app
