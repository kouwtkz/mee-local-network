/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TITLE?: string
  readonly VITE_BBS_TITLE?: string
  readonly VITE_USER_NAME?: string
  readonly VITE_LOGIN_PASSWORD?: string
  readonly VITE_COOKIE_VALUE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}