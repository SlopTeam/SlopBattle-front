import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { mockAccounts, type MockAccount } from '@/mocks/users'
import type { User } from '@/types/user'

// TODO : replace the mock with the back-end API. Until then, accounts and session only
// live in memory: a page reload forgets registered accounts and logs out.
const MOCK_LATENCY_MS = 400

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

function toUser({ id, username, email }: MockAccount): User {
  return { id, username, email }
}

export const useAuthStore = defineStore('auth', () => {
  const accounts = ref<MockAccount[]>(mockAccounts.map((account) => ({ ...account })))
  const user = ref<User | null>(null)
  const isAuthenticated = computed(() => user.value !== null)

  function findAccount(email: string): MockAccount | undefined {
    return accounts.value.find((account) => account.email === normalizeEmail(email))
  }

  // Async like the future API calls, so the views already handle the pending state
  async function login(email: string, password: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS))
    const account = findAccount(email)
    if (!account || account.password !== password) {
      throw new AuthError('Email ou mot de passe incorrect.')
    }
    user.value = toUser(account)
  }

  async function register(input: RegisterInput): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS))
    if (findAccount(input.email)) {
      throw new AuthError('Un compte existe déjà avec cet email.')
    }
    const account: MockAccount = {
      id: Math.max(0, ...accounts.value.map((existing) => existing.id)) + 1,
      username: input.username.trim(),
      email: normalizeEmail(input.email),
      password: input.password,
    }
    accounts.value.push(account)
    user.value = toUser(account)
  }

  function logout(): void {
    user.value = null
  }

  return { user, isAuthenticated, login, register, logout }
})
