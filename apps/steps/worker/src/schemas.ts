import { z } from 'zod'

/** D1 TEXT primary keys — crypto.randomUUID() or legacy seed ids (e.g. …000s1). */
export const entityIdSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[0-9a-zA-Z-]+$/, 'Invalid id format')
