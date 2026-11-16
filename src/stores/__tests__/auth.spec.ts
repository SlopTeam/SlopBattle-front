import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import * as authApi from '@/api/auth'
import { ApiError } from '@/api/graphql'
import { getToken, setToken } from '@/api/token'
import { AuthError, useAuthStore } from '@/stores/auth'
import type { User } from '@/types/user'

vi.mock('@/api/auth')

const profile: User = {
  id: 4,
  email: 'max@test.fr',
  username: 'Max',
  avatarUrl: null,
  coins: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
}

describe('useAuthStore', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetAllMocks()
    setActivePinia(createPinia())
  })

  it('logs in, stores the token and loads the profile', async () => {
    vi.mocked(authApi.login).mockResolvedValue('token-1')
    vi.mocked(authApi.fetchMyProfile).mockResolvedValue(profile)

    const auth = useAuthStore()
    await auth.login(' Max@Test.fr ', 'password1')

    expect(authApi.login).toHaveBeenCalledWith({ email: 'max@test.fr', password: 'password1' })
    expect(authApi.fetchMyProfile).toHaveBeenCalledWith('token-1')
    expect(getToken()).toBe('token-1')
    expect(auth.isAuthenticated).toBe(true)
    expect(auth.user).toEqual(profile)
  })

  it('maps rejected credentials to a readable message', async () => {
    vi.mocked(authApi.login).mockRejectedValue(
      new ApiError('Unauthorized', { status: 401, code: 'UNAUTHENTICATED' }),
    )

    const auth = useAuthStore()
    await expect(auth.login('max@test.fr', 'wrong')).rejects.toThrow(
      'Email ou mot de passe incorrect.',
    )
    expect(auth.isAuthenticated).toBe(false)
    expect(getToken()).toBeNull()
  })

  it('registers then sets the username', async () => {
    vi.mocked(authApi.register).mockResolvedValue('token-2')
    vi.mocked(authApi.fetchMyProfile).mockResolvedValue({ ...profile, username: null })
    vi.mocked(authApi.updateMyProfile).mockImplementation(async () => {
      vi.mocked(authApi.fetchMyProfile).mockResolvedValue(profile)
    })

    const auth = useAuthStore()
    await auth.register({ username: ' Max ', email: 'max@test.fr', password: 'password1' })

    expect(authApi.register).toHaveBeenCalledWith({ email: 'max@test.fr', password: 'password1' })
    expect(authApi.updateMyProfile).toHaveBeenCalledWith({ username: 'Max' })
    expect(auth.user?.username).toBe('Max')
    expect(auth.needsUsername).toBe(false)
  })

  it('keeps the session and asks for a username when it is refused', async () => {
    vi.mocked(authApi.register).mockResolvedValue('token-2')
    vi.mocked(authApi.fetchMyProfile).mockResolvedValue({ ...profile, username: null })
    vi.mocked(authApi.updateMyProfile).mockRejectedValue(new ApiError('Pseudo déjà pris'))

    const auth = useAuthStore()
    await auth.register({ username: 'Max', email: 'max@test.fr', password: 'password1' })

    expect(auth.isAuthenticated).toBe(true)
    expect(auth.needsUsername).toBe(true)
  })

  it('maps an email already in use to a readable message', async () => {
    vi.mocked(authApi.register).mockRejectedValue(new ApiError('Email already exists'))

    const auth = useAuthStore()
    const register = auth.register({ username: 'Max', email: 'max@test.fr', password: 'password1' })
    await expect(register).rejects.toThrow('Un compte existe déjà avec cet email.')
    await expect(register).rejects.toBeInstanceOf(AuthError)
  })

  it('does not keep a token the back-end refuses (loginWithToken)', async () => {
    vi.mocked(authApi.fetchMyProfile).mockRejectedValue(
      new ApiError('Unauthorized', { status: 401 }),
    )

    const auth = useAuthStore()
    await expect(auth.loginWithToken('bad-token')).rejects.toBeInstanceOf(AuthError)
    expect(getToken()).toBeNull()
    expect(auth.isAuthenticated).toBe(false)
  })

  it('restores the session from the stored token', async () => {
    setToken('token-3')
    vi.mocked(authApi.fetchMyProfile).mockResolvedValue(profile)

    const auth = useAuthStore()
    await auth.init()
    await auth.init()

    expect(authApi.fetchMyProfile).toHaveBeenCalledTimes(1)
    expect(auth.user).toEqual(profile)
  })

  it('does not call the API on init without a token', async () => {
    const auth = useAuthStore()
    await auth.init()
    expect(authApi.fetchMyProfile).not.toHaveBeenCalled()
    expect(auth.isAuthenticated).toBe(false)
  })

  it('clears the session on logout', async () => {
    vi.mocked(authApi.login).mockResolvedValue('token-1')
    vi.mocked(authApi.fetchMyProfile).mockResolvedValue(profile)

    const auth = useAuthStore()
    await auth.login('max@test.fr', 'password1')
    auth.logout()

    expect(auth.isAuthenticated).toBe(false)
    expect(getToken()).toBeNull()
  })
})
