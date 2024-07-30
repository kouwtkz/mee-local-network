declare module 'process' {
  global {
    namespace NodeJS {
      interface ProcessEnv {
        readonly NODE_ENV?: string;
        readonly LOGIN_PASSWORD?: string;
        readonly COOKIE_VALUE?: string;
      }
    }
  }
}