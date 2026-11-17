import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // '' prefix: also reads variables not exposed to the client, such as API_PROXY_TARGET
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.API_PROXY_TARGET || 'http://localhost:3000'

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
    // Only /auth/google is proxied: /auth/callback is a front-end route.
    server: {
      proxy: {
        '/graphql': apiTarget,
        '/auth/google': apiTarget,
      },
    },
  }
})
