import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import AuthCallbackView from '@/views/auth/AuthCallbackView.vue'
import { rememberRedirect } from '@/composables/useAuthRedirect'
import { AuthError, useAuthStore } from '@/stores/auth'

function setup() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div />' } },
      { path: '/catalogue', name: 'catalogue', component: { template: '<div />' } },
      { path: '/login', name: 'login', component: { template: '<div />' } },
      { path: '/auth/callback', name: 'auth_callback', component: AuthCallbackView },
    ],
  })
  return { pinia, router, auth: useAuthStore() }
}

async function mountCallback(hash: string) {
  const { pinia, router, auth } = setup()
  await router.push(`/auth/callback${hash}`)
  const wrapper = mount(AuthCallbackView, { global: { plugins: [pinia, router] } })
  await flushPromises()
  return { wrapper, router, auth }
}

describe('AuthCallbackView', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('logs in with the token from the fragment, then goes home without it in the URL', async () => {
    const { pinia, router, auth } = setup()
    const loginWithToken = vi.spyOn(auth, 'loginWithToken').mockResolvedValue()
    await router.push('/auth/callback#access_token=abc.def')
    mount(AuthCallbackView, { global: { plugins: [pinia, router] } })
    await flushPromises()

    expect(loginWithToken).toHaveBeenCalledWith('abc.def')
    expect(router.currentRoute.value.name).toBe('home')
    expect(router.currentRoute.value.hash).toBe('')
  })

  it('goes back to the page remembered before the Google round trip', async () => {
    rememberRedirect('/catalogue')
    const { pinia, router, auth } = setup()
    vi.spyOn(auth, 'loginWithToken').mockResolvedValue()
    await router.push('/auth/callback#access_token=abc.def')
    mount(AuthCallbackView, { global: { plugins: [pinia, router] } })
    await flushPromises()

    expect(router.currentRoute.value.fullPath).toBe('/catalogue')
  })

  it('shows an error when there is no token', async () => {
    const { wrapper, router } = await mountCallback('')
    expect(wrapper.text()).toContain('La connexion avec Google a échoué.')
    expect(router.currentRoute.value.name).toBe('auth_callback')
  })

  it('shows an error when the token is refused', async () => {
    const { pinia, router, auth } = setup()
    vi.spyOn(auth, 'loginWithToken').mockRejectedValue(new AuthError('Token invalide'))
    await router.push('/auth/callback#access_token=bad')
    const wrapper = mount(AuthCallbackView, { global: { plugins: [pinia, router] } })
    await flushPromises()

    expect(wrapper.text()).toContain('Token invalide')
  })
})
