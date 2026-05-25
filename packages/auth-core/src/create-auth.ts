import type { D1Database } from '@cloudflare/workers-types'
import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import type { BetterAuthOptions } from 'better-auth'
import { betterAuth } from 'better-auth'
import { drizzle } from 'drizzle-orm/d1'

import { authSchema } from './schema.js'

export type AuthBindings = {
  DB: D1Database
  BETTER_AUTH_SECRET: string
  BETTER_AUTH_URL: string
  /** Comma-separated extra origins (e.g. Vite dev server when API is proxied). */
  BETTER_AUTH_TRUSTED_ORIGINS?: string
  GOOGLE_CLIENT_ID?: string
  GOOGLE_CLIENT_SECRET?: string
  FACEBOOK_CLIENT_ID?: string
  FACEBOOK_CLIENT_SECRET?: string
}

export type CreatePlaygroundAuthOptions = {
  appName: string
  /** Called after a new user row is created (register or OAuth sign-up). */
  onAfterRegister?: (userId: string) => Promise<void>
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
  const db = drizzle(env.DB, { schema: authSchema })

  const databaseHooks: BetterAuthOptions['databaseHooks'] | undefined =
    options.onAfterRegister
      ? {
          user: {
            create: {
              after: async (user) => {
                await options.onAfterRegister!(user.id)
              }
            }
          }
        }
      : undefined

  const { trustedOrigins: extraTrustedOrigins, ...restAuthOptions } =
    options.authOptions ?? {}

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
    ...restAuthOptions
  })
}

export type PlaygroundAuth = ReturnType<typeof createPlaygroundAuth>
