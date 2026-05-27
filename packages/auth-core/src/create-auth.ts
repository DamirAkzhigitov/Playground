import type { D1Database } from '@cloudflare/workers-types'
import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import type { BetterAuthOptions } from 'better-auth'
import { betterAuth } from 'better-auth'
import { drizzle } from 'drizzle-orm/d1'

import { getAuthDatabase } from './database.js'
import { authSchema } from './schema.js'
import {
  buildPlaygroundSsoOptions,
  mergeBetterAuthAdvanced,
  resolveSsoCookieDomain
} from './sso.js'

export type AuthBindings = {
  /** App data (listings, actions, …). Auth uses `AUTH_DB` when set. */
  DB: D1Database
  /** Shared Better Auth D1 (`playground-auth-db`) for SSO across tools. */
  AUTH_DB?: D1Database
  BETTER_AUTH_SECRET: string
  BETTER_AUTH_URL: string
  /** Comma-separated extra origins (e.g. Vite dev server when API is proxied). */
  BETTER_AUTH_TRUSTED_ORIGINS?: string
  /**
   * When set (e.g. `.da-mr.com`), session cookies are shared across tool subdomains.
   * Requires the same D1 database + `BETTER_AUTH_SECRET` on every participating Worker.
   * See packages/auth-core/SSO.md.
   */
  AUTH_COOKIE_DOMAIN?: string
  GOOGLE_CLIENT_ID?: string
  GOOGLE_CLIENT_SECRET?: string
  FACEBOOK_CLIENT_ID?: string
  FACEBOOK_CLIENT_SECRET?: string
}

export type CreatePlaygroundAuthOptions = {
  appName: string
  /**
   * Called after a new user row is created (register or OAuth sign-up).
   * Use to seed app data or mirror the user id into an app DB that still has `user_id` FKs.
   */
  onAfterRegister?: (user: {
    id: string
    email: string
    name?: string | null
  }) => Promise<void>
  /**
   * Cross-subdomain SSO cookie domain (overrides `AUTH_COOKIE_DOMAIN` binding).
   * Use `.da-mr.com` only with a shared auth D1 + secret across tools.
   */
  ssoCookieDomain?: string
  /** Extra Better Auth options (trustedOrigins, advanced cookies, etc.). */
  authOptions?: Partial<BetterAuthOptions>
}

const sharedUserFields = {
  role: {
    type: 'string' as const,
    defaultValue: 'user',
    input: false
  },
  locale: {
    type: 'string' as const,
    defaultValue: 'en',
    input: false
  }
}

function buildTrustedOrigins(
  env: AuthBindings,
  extra?: BetterAuthOptions['trustedOrigins']
): string[] {
  const origins = new Set<string>([env.BETTER_AUTH_URL.replace(/\/$/, '')])

  for (const part of env.BETTER_AUTH_TRUSTED_ORIGINS?.split(',') ?? []) {
    const trimmed = part.trim().replace(/\/$/, '')
    if (trimmed) origins.add(trimmed)
  }

  if (Array.isArray(extra)) {
    for (const origin of extra) {
      if (typeof origin === 'string') {
        origins.add(origin.replace(/\/$/, ''))
      }
    }
  }

  return [...origins]
}

function socialProviders(env: AuthBindings) {
  const providers: NonNullable<BetterAuthOptions['socialProviders']> = {}

  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    providers.google = {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET
    }
  }

  if (env.FACEBOOK_CLIENT_ID && env.FACEBOOK_CLIENT_SECRET) {
    providers.facebook = {
      clientId: env.FACEBOOK_CLIENT_ID,
      clientSecret: env.FACEBOOK_CLIENT_SECRET
    }
  }

  return providers
}

export function createPlaygroundAuth(
  env: AuthBindings,
  options: CreatePlaygroundAuthOptions
) {
  const db = drizzle(getAuthDatabase(env), { schema: authSchema })

  const databaseHooks: BetterAuthOptions['databaseHooks'] | undefined =
    options.onAfterRegister
      ? {
          user: {
            create: {
              after: async (user) => {
                await options.onAfterRegister!({
                  id: user.id,
                  email: user.email,
                  name: user.name
                })
              }
            }
          }
        }
      : undefined

  const {
    trustedOrigins: extraTrustedOrigins,
    advanced: extraAdvanced,
    ...restAuthOptions
  } = options.authOptions ?? {}

  const ssoDomain = resolveSsoCookieDomain(env, options.ssoCookieDomain)
  const ssoAdvanced = ssoDomain
    ? buildPlaygroundSsoOptions({ cookieDomain: ssoDomain }).advanced
    : undefined
  const advanced = mergeBetterAuthAdvanced(ssoAdvanced, extraAdvanced)

  return betterAuth({
    appName: options.appName,
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    basePath: '/api/auth',
    trustedOrigins: buildTrustedOrigins(env, extraTrustedOrigins),
    database: drizzleAdapter(db, {
      provider: 'sqlite',
      schema: {
        ...authSchema,
        user: authSchema.users
      },
      camelCase: true,
      usePlural: false,
      transaction: false
    }),
    emailAndPassword: { enabled: true },
    user: {
      modelName: 'users',
      additionalFields: sharedUserFields
    },
    socialProviders: socialProviders(env),
    databaseHooks,
    ...restAuthOptions,
    ...(advanced ? { advanced } : {})
  })
}

export type PlaygroundAuth = ReturnType<typeof createPlaygroundAuth>
