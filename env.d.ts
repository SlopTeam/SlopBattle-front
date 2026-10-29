/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Back URL in production. Empty in dev: the proxy in vite.config.ts takes over
  readonly VITE_API_URL?: string
}
