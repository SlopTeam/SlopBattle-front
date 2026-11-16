import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
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
  // In dev, /graphql goes through Vite: same origin, so no CORS to configure on the back
  server: {
    proxy: {
      '/graphql': 'http://localhost:3000',
    },
  },
})
