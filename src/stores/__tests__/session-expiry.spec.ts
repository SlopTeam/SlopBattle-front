import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { getToken, setToken } from '@/api/token'
import { useAuthStore } from '@/stores/auth'

function respond(body: unknown, status = 200) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: status < 400, status, json: async () => body }),
  )
}

describe('session expiry', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('logs out and flags the expiry when the back-end rejects the stored token', async () => {
    setToken('expired-token')
    respond({ errors: [{ message: 'Unauthorized', extensions: { code: 'UNAUTHENTICATED' } }] })

    const auth = useAuthStore()
    await auth.init()

    expect(auth.isAuthenticated).toBe(false)
    expect(auth.sessionExpired).toBe(true)
    expect(getToken()).toBeNull()
  })

  it('keeps a valid token when the server is unreachable', async () => {
    setToken('valid-token')
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    const auth = useAuthStore()
    await auth.init()

    expect(auth.isAuthenticated).toBe(false)
    expect(auth.sessionExpired).toBe(false)
    expect(getToken()).toBe('valid-token')
  })

  it('does not flag a wrong password as an expired session', async () => {
    respond({ errors: [{ message: 'Unauthorized', extensions: { code: 'UNAUTHENTICATED' } }] })

    const auth = useAuthStore()
    await expect(auth.login('max@test.fr', 'wrong')).rejects.toThrow(
      'Email ou mot de passe incorrect.',
    )
    expect(auth.sessionExpired).toBe(false)
  })
})
