import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { getToken, setToken } from '@/api/token'
import { useAuthStore } from '@/stores/auth'

// Store + api/auth + api/client together: only the network (axios) is replaced
const { post } = vi.hoisted(() => ({
  post: vi.fn<
    (url: string, body: unknown, config: { headers: Record<string, string> }) => Promise<unknown>
  >(),
}))

vi.mock('axios', () => ({ default: { create: () => ({ post }) } }))

function respond(body: unknown, status = 200) {
  post.mockResolvedValue({ status, data: body })
}

const unauthenticated = {
  errors: [{ message: 'Unauthorized', extensions: { code: 'UNAUTHENTICATED' } }],
}

describe('session expiry', () => {
  beforeEach(() => {
    localStorage.clear()
    post.mockReset()
    setActivePinia(createPinia())
  })

  it('logs out and flags the expiry when the back-end rejects the stored token', async () => {
    setToken('expired-token')
    respond(unauthenticated)

    const auth = useAuthStore()
    await auth.init()

    expect(auth.isAuthenticated).toBe(false)
    expect(auth.sessionExpired).toBe(true)
    expect(getToken()).toBeNull()
  })

  it('keeps a valid token when the server is unreachable', async () => {
    setToken('valid-token')
    post.mockRejectedValue(Object.assign(new Error('Network Error'), { code: 'ERR_NETWORK' }))

    const auth = useAuthStore()
    await auth.init()

    expect(auth.isAuthenticated).toBe(false)
    expect(auth.sessionExpired).toBe(false)
    expect(getToken()).toBe('valid-token')
  })

  it('does not flag a wrong password as an expired session', async () => {
    respond(unauthenticated)

    const auth = useAuthStore()
    await expect(auth.login('max@test.fr', 'wrong')).rejects.toThrow(
      'Email ou mot de passe incorrect.',
    )
    expect(auth.sessionExpired).toBe(false)
  })

  it('keeps a token left in storage when a login fails, and does not send it', async () => {
    setToken('valid-token')
    respond(unauthenticated)

    const auth = useAuthStore()
    await expect(auth.login('max@test.fr', 'wrong')).rejects.toThrow(
      'Email ou mot de passe incorrect.',
    )

    expect(post.mock.lastCall?.[2].headers).toEqual({})
    expect(getToken()).toBe('valid-token')
    expect(auth.sessionExpired).toBe(false)
  })
})
