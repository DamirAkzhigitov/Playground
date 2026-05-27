import type { BetterAuthOptions } from 'better-auth'

/** Parent-domain cookie for SSO across `*.da-mr.com` tool subdomains. */
export const DEFAULT_SSO_COOKIE_DOMAIN = '.da-mr.com'

export type PlaygroundSsoConfig = {
  /** e.g. `.da-mr.com` — must start with `.` for subdomain sharing. */
  cookieDomain: string
}

/**
 * Better Auth advanced options for cross-subdomain session cookies.
 * Requires a **shared** D1 auth database and the same `BETTER_AUTH_SECRET` on every tool Worker.
 */
export function buildPlaygroundSsoOptions(
  config: PlaygroundSsoConfig
): Pick<BetterAuthOptions, 'advanced'> {
  const domain = config.cookieDomain.trim()
  if (!domain.startsWith('.')) {
    throw new Error(
      `SSO cookie domain must start with "." (got "${domain}"). Use "${DEFAULT_SSO_COOKIE_DOMAIN}".`
    )
  }

  return {
    advanced: {
      crossSubDomainCookies: {
        enabled: true,
        domain
      }
    }
  }
}

export function resolveSsoCookieDomain(
  env: { AUTH_COOKIE_DOMAIN?: string },
  explicitDomain?: string
): string | undefined {
  const raw = explicitDomain ?? env.AUTH_COOKIE_DOMAIN
  const trimmed = raw?.trim()
  return trimmed || undefined
}

export function mergeBetterAuthAdvanced(
  base: BetterAuthOptions['advanced'] | undefined,
  extra: BetterAuthOptions['advanced'] | undefined
): BetterAuthOptions['advanced'] | undefined {
  if (!base && !extra) return undefined

  const baseCookies = base?.crossSubDomainCookies
  const extraCookies = extra?.crossSubDomainCookies
  type CrossSubDomainCookies = NonNullable<
    NonNullable<BetterAuthOptions['advanced']>['crossSubDomainCookies']
  >

  const crossSubDomainCookies: CrossSubDomainCookies | undefined =
    baseCookies || extraCookies
      ? {
          enabled: extraCookies?.enabled ?? baseCookies?.enabled ?? false,
          domain: extraCookies?.domain ?? baseCookies?.domain,
          additionalCookies:
            extraCookies?.additionalCookies ?? baseCookies?.additionalCookies
        }
      : undefined

  return {
    ...base,
    ...extra,
    ...(crossSubDomainCookies ? { crossSubDomainCookies } : {})
  }
}
