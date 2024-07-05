/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_COOKIE_VALUE?: string
  readonly VITE_COOKIE_PASSWORD?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}