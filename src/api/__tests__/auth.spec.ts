import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchMyProfile, login, register, updateMyProfile } from '@/api/auth'

const { gql } = vi.hoisted(() => ({
  gql: vi.fn<
    (
      query: string,
      variables?: Record<string, unknown>,
      options?: { token?: string | null },
    ) => Promise<unknown>
  >(),
}))

vi.mock('@/api/client', () => ({ gql }))

const credentials = { email: 'max@test.fr', password: 'secret123' }

beforeEach(() => {
  gql.mockReset()
})

describe('login / register', () => {
  it('returns the access token, without sending a stored one', async () => {
    gql.mockResolvedValueOnce({ login: { access_token: 'jwt-1' } })
    await expect(login(credentials)).resolves.toBe('jwt-1')
    expect(gql.mock.lastCall?.[1]).toEqual({ input: credentials })
    expect(gql.mock.lastCall?.[2]).toEqual({ token: null })

    gql.mockResolvedValueOnce({ register: { access_token: 'jwt-2' } })
    await expect(register(credentials)).resolves.toBe('jwt-2')
    expect(gql.mock.lastCall?.[2]).toEqual({ token: null })
  })
})

describe('fetchMyProfile', () => {
  it('uses the given token (Google callback)', async () => {
    gql.mockResolvedValueOnce({ myProfile: { id: 4, email: 'max@test.fr', username: 'Max' } })
    await expect(fetchMyProfile('jwt-google')).resolves.toMatchObject({ id: 4, username: 'Max' })
    expect(gql.mock.lastCall?.[2]).toEqual({ token: 'jwt-google' })
  })

  it('falls back to the stored token', async () => {
    gql.mockResolvedValueOnce({ myProfile: { id: 1 } })
    await fetchMyProfile()
    expect(gql.mock.lastCall?.[2]).toEqual({ token: undefined })
  })
})

describe('updateMyProfile', () => {
  it('sends the input', async () => {
    gql.mockResolvedValueOnce({ updateMyProfile: { id: '1' } })
    await updateMyProfile({ username: 'Max' })
    expect(gql.mock.lastCall?.[1]).toEqual({ input: { username: 'Max' } })
  })
})
