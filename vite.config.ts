import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// Replaced by VITE_BACKEND_URL and API_PROXY_TARGET: warn instead of ignoring them silently
const LEGACY_ENV = ['VITE_API_URL', 'VITE_API_BASE_URL']

/** Back-end root, without a trailing slash nor /graphql: the proxy appends the request path to it */
function toProxyTarget(url: string): string {
  const trimmed = url.replace(/\/+$/, '')
  const root = trimmed.replace(/\/graphql$/, '')
  if (root !== trimmed) {
    console.warn(`API_PROXY_TARGET must be the back-end root, without /graphql: using "${root}"`)
  }
  return root
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // '' prefix: also reads variables not exposed to the client, such as API_PROXY_TARGET
  const env = loadEnv(mode, process.cwd(), '')
  for (const name of LEGACY_ENV.filter((key) => env[key])) {
    console.warn(
      `${name} is no longer read: see VITE_BACKEND_URL and API_PROXY_TARGET in .env.example`,
    )
  }
  const apiTarget = toProxyTarget(env.API_PROXY_TARGET || 'http://localhost:3000')

  return {
    plugins: [vue(), vueDevTools()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          // Maps and mixins available in every <style lang="scss"> without an import
          additionalData: `@use "@/assets/styles/abstracts" as *;\n`,
        },
      },
    },
    // In dev, back-end routes go through Vite: same origin, so no CORS to configure on the back.
    // Only /auth/google is proxied: /auth/callback is a front-end route. /media serves uploaded card images.
    server: {
      proxy: {
        '/graphql': apiTarget,
        '/auth/google': apiTarget,
        '/media': apiTarget,
      },
    },
  }
})
