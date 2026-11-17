import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'

let href = ''

/** Mounts a fresh GoogleButton for a given VITE_BACKEND_URL on /login, then clicks it */
async function clickGoogle(backendUrl: string, query = '') {
  vi.stubEnv('VITE_BACKEND_URL', backendUrl)
  vi.resetModules()
  const { default: GoogleButton } = await import('@/components/auth/GoogleButton.vue')
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/login', component: { template: '<div />' } }],
  })
  await router.push(`/login${query}`)
  const wrapper = mount(GoogleButton, { global: { plugins: [router] } })
  await wrapper.get('button').trigger('click')
}

describe('GoogleButton', () => {
  beforeEach(() => {
    sessionStorage.clear()
    href = ''
    // Records the full page navigation instead of leaving jsdom
    vi.stubGlobal('location', {
      get href() {
        return 'http://front.test/login'
      },
      set href(value: string) {
        href = value
      },
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('goes to the back-end /auth/google on the same origin by default', async () => {
    await clickGoogle('')
    expect(href).toBe('/auth/google')
  })

  it('goes to the back-end root, never under a /graphql copied into VITE_BACKEND_URL', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    await clickGoogle('http://localhost:3000/graphql/')
    expect(href).toBe('http://localhost:3000/auth/google')
  })

  it('remembers the redirect for after the round trip', async () => {
    await clickGoogle('', '?redirect=/catalogue')
    expect(sessionStorage.getItem('slop-battle:auth-redirect')).toBe('/catalogue')
  })
})
