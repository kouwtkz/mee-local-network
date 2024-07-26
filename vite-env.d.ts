/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BUILD_TIME?: string
  readonly VITE_STYLES_TIME?: string
  readonly VITE_TITLE?: string
  readonly VITE_BBS_TITLE?: string
  readonly VITE_USER_NAME?: string
  readonly VITE_LOGIN_PASSWORD?: string
  readonly VITE_COOKIE_VALUE?: string
  readonly VITE_ADD_DM?: string
  readonly VITE_TWITTER_MEDIA?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}