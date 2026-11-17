import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import * as authApi from '@/api/auth'
import { setToken } from '@/api/token'
import router from '@/router'

vi.mock('@/api/auth')

const withoutUsername = {
  id: 1,
  email: 'a@test.fr',
  username: null,
  avatarUrl: null,
  coins: 0,
  createdAt: '2026-11-01T00:00:00.000Z',
}

describe('router guard', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetAllMocks()
    setActivePinia(createPinia())
    // A stored session whose user has not picked a username yet (Google sign-up left midway)
    setToken('old-token')
    vi.mocked(authApi.fetchMyProfile).mockResolvedValue(withoutUsername)
  })

  it('sends a user without a username to choose_username, keeping the target', async () => {
    await router.push('/catalogue')
    expect(router.currentRoute.value.name).toBe('choose_username')
    expect(router.currentRoute.value.query).toEqual({ redirect: '/catalogue' })
  })

  it('lets the Google return through, so its token never lands in a ?redirect= query', async () => {
    await router.push('/auth/callback#access_token=new-token')
    expect(router.currentRoute.value.name).toBe('auth_callback')
    expect(router.currentRoute.value.query).toEqual({})
  })
})
