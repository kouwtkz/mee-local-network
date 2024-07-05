/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TITLE?: string
  readonly VITE_COOKIE_VALUE?: string
  readonly VITE_LOGIN_PASSWORD?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}