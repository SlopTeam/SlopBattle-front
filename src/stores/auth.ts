import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import * as authApi from '@/api/auth'
import { ApiError, setUnauthorizedHandler } from '@/api/client'
import { clearToken, getToken, setToken } from '@/api/token'
import type { User } from '@/types/user'

/** Error whose message can be shown as is to the user */
export class AuthError extends Error {}

export interface RegisterInput {
  username: string
  email: string
  password: string
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function toAuthError(error: unknown, overrides: { unauthorized?: string; conflict?: string } = {}) {
  if (error instanceof AuthError) return error
  if (error instanceof ApiError) {
    if (overrides.unauthorized && error.isUnauthorized) {
      return new AuthError(overrides.unauthorized)
    }
    if (overrides.conflict && (error.status === 409 || /exist|already/i.test(error.message))) {
      return new AuthError(overrides.conflict)
    }
    return new AuthError(error.message)
  }
  return new AuthError('Une erreur est survenue, réessayez.')
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const isAuthenticated = computed(() => user.value !== null)
  /** Logged in but no username yet (Google sign-in, or a registration interrupted midway) */
  const needsUsername = computed(() => user.value !== null && !user.value.username)

  /** Set when the back-end rejects the token; the router reacts to it (see router/index.ts) */
  const sessionExpired = ref(false)

  let initPromise: Promise<void> | null = null

  function logout(): void {
    clearToken()
    user.value = null
  }

  // A rejected token (expired, revoked) ends the session wherever the request comes from
  setUnauthorizedHandler(() => {
    logout()
    sessionExpired.value = true
  })

  async function loadProfile(token?: string): Promise<void> {
    user.value = await authApi.fetchMyProfile(token)
  }

  /** Stores the token only once it is known to work, so a bad token never leaves a half session */
  async function startSession(token: string): Promise<void> {
    await loadProfile(token)
    setToken(token)
  }

  async function login(email: string, password: string): Promise<void> {
    try {
      const token = await authApi.login({ email: normalizeEmail(email), password })
      await startSession(token)
    } catch (error) {
      throw toAuthError(error, { unauthorized: 'Email ou mot de passe incorrect.' })
    }
  }

  async function register({ username, email, password }: RegisterInput): Promise<void> {
    try {
      const token = await authApi.register({ email: normalizeEmail(email), password })
      await startSession(token)
    } catch (error) {
      throw toAuthError(error, { conflict: 'Un compte existe déjà avec cet email.' })
    }

    // The account exists at this point: if the username is refused (e.g. already taken), the
    // session is kept and `needsUsername` sends the user to pick another one
    try {
      await setUsername(username)
    } catch {
      // Handled by the username page
    }
  }

  /** Session started elsewhere (Google callback) */
  async function loginWithToken(token: string): Promise<void> {
    try {
      await startSession(token)
    } catch (error) {
      throw toAuthError(error)
    }
  }

  async function setUsername(username: string): Promise<void> {
    try {
      await authApi.updateMyProfile({ username: username.trim() })
      await loadProfile()
    } catch (error) {
      throw toAuthError(error)
    }
  }

  /** Restores the session from the stored token, once per page load */
  function init(): Promise<void> {
    initPromise ??= (async () => {
      if (!getToken()) return
      try {
        await loadProfile()
      } catch {
        // Rejected token: the unauthorized handler already logged out. Any other failure
        // (server down) leaves the user logged out for now, without dropping a valid token.
      }
    })()
    return initPromise
  }

  return {
    user,
    isAuthenticated,
    needsUsername,
    sessionExpired,
    login,
    register,
    loginWithToken,
    setUsername,
    init,
    logout,
  }
})
