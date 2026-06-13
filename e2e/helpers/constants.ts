/** Shared URLs and seed credentials for auth e2e. */
export const HOST = '127.0.0.1'

export const AUTH_UI = `http://${HOST}:3004`
export const STEPS_UI = `http://${HOST}:3003`
export const COMPARE_UI = `http://${HOST}:3002`

export const AUTH_API = `http://${HOST}:8789`
export const STEPS_API = `http://${HOST}:8787`
export const COMPARE_API = `http://${HOST}:8788`

export const SEED_USER = {
  email: 'seed+user@local.test',
  password: 'SeedPass123!'
} as const

export const SEED_ACTION_TITLE = 'Buying an apartment with a mortgage'
