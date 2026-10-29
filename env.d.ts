/// <reference types="vite/client" />

interface ImportMetaEnv {
  // URL du back en production. Vide en dev : le proxy de vite.config.ts prend le relais
  readonly VITE_API_URL?: string
}
