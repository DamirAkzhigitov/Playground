import { getCloudflareContext } from '@opennextjs/cloudflare'

/**
 * Resolve the D1 binding. Uses the async form so it works during both
 * request rendering and static generation. The `DB` binding is declared in
 * wrangler.jsonc; typing is loose here so we do not depend on regenerated
 * cloudflare-env.d.ts.
 */
export async function getDb(): Promise<D1Database> {
  const { env } = await getCloudflareContext({ async: true })
  const db = (env as unknown as { DB?: D1Database }).DB

  if (!db) {
    throw new Error(
      'D1 binding "DB" is not configured. Add it to wrangler.jsonc and run db:migrate:local.'
    )
  }

  return db
}
