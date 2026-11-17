/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Back-end root URL, without /graphql (e.g. https://api.example.com).
   * Empty or unset: same origin, through the Vite proxy in dev and the reverse proxy in production.
   */
  readonly VITE_BACKEND_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
