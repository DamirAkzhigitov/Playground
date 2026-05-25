import { createPlaygroundAuth } from '@playground/auth-core'
import type { AppEnv } from './types'
import { seedDefaultData } from './seed'

export function getAuth(env: AppEnv['Bindings']) {
  return createPlaygroundAuth(env, {
    appName: 'Compare',
    onAfterRegister: async (userId) => {
      await seedDefaultData(env.DB, userId)
    }
  })
}
