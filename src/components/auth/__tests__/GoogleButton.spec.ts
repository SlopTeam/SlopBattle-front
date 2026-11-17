import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import GoogleButton from '@/components/auth/GoogleButton.vue'

let href = ''

/** Mounts GoogleButton on /login, then clicks it */
async function clickGoogle(query = '') {
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
  })

  it('goes to the back-end /auth/google on the same origin', async () => {
    await clickGoogle()
    expect(href).toBe('/auth/google')
  })

  it('remembers the redirect for after the round trip', async () => {
    await clickGoogle('?redirect=/catalogue')
    expect(sessionStorage.getItem('slop-battle:auth-redirect')).toBe('/catalogue')
  })
})
