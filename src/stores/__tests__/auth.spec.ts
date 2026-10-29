import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { DEMO_ACCOUNT } from '@/mocks/users'
import { AuthError, useAuthStore } from '@/stores/auth'

// Resolves the mocked latency without waiting for it. The rejection is caught right away
// (then rethrown) so a failing call is not reported as unhandled while timers run.
async function settle<T>(promise: Promise<T>): Promise<T> {
  const outcome = promise.then(
    (value) => ({ ok: true as const, value }),
    (error: unknown) => ({ ok: false as const, error }),
  )
  await vi.runAllTimersAsync()
  const result = await outcome
  if (!result.ok) throw result.error
  return result.value
}

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('logs in with the demo account, ignoring email case and spaces', async () => {
    const auth = useAuthStore()
    await settle(auth.login(` ${DEMO_ACCOUNT.email.toUpperCase()} `, DEMO_ACCOUNT.password))
    expect(auth.isAuthenticated).toBe(true)
    expect(auth.user).toEqual({
      id: DEMO_ACCOUNT.id,
      username: DEMO_ACCOUNT.username,
      email: DEMO_ACCOUNT.email,
    })
  })

  it('rejects a wrong password', async () => {
    const auth = useAuthStore()
    await expect(settle(auth.login(DEMO_ACCOUNT.email, 'wrong-password'))).rejects.toBeInstanceOf(
      AuthError,
    )
    expect(auth.isAuthenticated).toBe(false)
  })

  it('registers a new account, logs it in, and lets it log in again', async () => {
    const auth = useAuthStore()
    await settle(
      auth.register({ username: 'Nouveau', email: 'new@test.fr', password: 'password1' }),
    )
    expect(auth.user).toMatchObject({ id: 2, username: 'Nouveau', email: 'new@test.fr' })

    auth.logout()
    expect(auth.isAuthenticated).toBe(false)

    await settle(auth.login('new@test.fr', 'password1'))
    expect(auth.user?.username).toBe('Nouveau')
  })

  it('refuses to register an email already in use', async () => {
    const auth = useAuthStore()
    const register = auth.register({
      username: 'Copie',
      email: DEMO_ACCOUNT.email,
      password: 'password1',
    })
    await expect(settle(register)).rejects.toThrow('Un compte existe déjà avec cet email.')
  })
})
