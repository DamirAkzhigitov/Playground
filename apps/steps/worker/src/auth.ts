import { createPlaygroundAuth } from '@playground/auth-core'
import type { AppEnv } from './types'

export function getAuth(env: AppEnv['Bindings']) {
  return createPlaygroundAuth(env, {
    appName: 'Steps'
  })
}
