interface ImportMetaEnv {
  readonly VITE_BUILD_TIME?: string;
  readonly VITE_STYLES_TIME?: string;
  readonly VITE_TITLE?: string;
  readonly VITE_BBS_TITLE?: string;
  readonly VITE_USER_NAME?: string;
  readonly VITE_DM_PATH?: string;
  readonly VITE_DM_LINKS?: string;
  readonly VITE_TWITTER_MEDIA?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
