interface ImportMetaEnv {
  readonly VITE_AUTH_ORIGIN?: string
  readonly DEV: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
