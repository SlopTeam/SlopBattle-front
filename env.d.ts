/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** GraphQL endpoint of the back-end */
  readonly VITE_API_URL: string
  /** Back-end root URL, used for REST routes such as /auth/google */
  readonly VITE_API_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
