import { Hono } from 'hono'
import type { AppEnv } from '../types'
import { listInspectionTemplatesPublic } from '../inspectionTemplates'

const inspectionTemplates = new Hono<AppEnv>()

inspectionTemplates.get('/', (c) => {
  return c.json(listInspectionTemplatesPublic())
})

export { inspectionTemplates }
