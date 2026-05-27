import { createPlaygroundAuth } from '@playground/auth-core'
import type { AppEnv } from './types'
import { mirrorUserToAppDb } from './mirror-app-user'
import { seedDefaultData } from './seed'

export function getAuth(env: AppEnv['Bindings']) {
  return createPlaygroundAuth(env, {
    appName: 'Compare',
    onAfterRegister: async (user) => {
      await mirrorUserToAppDb(env.DB, user)
      await seedDefaultData(env.DB, user.id)
    }
  })
}
