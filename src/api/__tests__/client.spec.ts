import { describe, it, expect, vi } from 'vitest'
import { gql, TOKEN_KEY } from '@/api/client'

type RequestConfig = { headers: Record<string, string> }

const { post, use, config } = vi.hoisted(() => ({
  post: vi.fn<() => Promise<unknown>>(),
  use: vi.fn<(interceptor: (c: RequestConfig) => RequestConfig) => void>(),
  config: {} as { validateStatus?: (status: number) => boolean },
}))

vi.mock('axios', () => ({
  default: {
    create: (c: typeof config) => {
      Object.assign(config, c)
      return { post, interceptors: { request: { use } } }
    },
  },
}))

describe('gql', () => {
  it('returns data on success', async () => {
    post.mockResolvedValueOnce({ status: 200, data: { data: { cards: [] } } })
    await expect(gql('{ cards { id } }')).resolves.toEqual({ cards: [] })
  })

  it('throws the GraphQL message from the back (200 or 400)', async () => {
    // Without it, axios would reject the 400 before we read the GraphQL message
    expect(config.validateStatus?.(400)).toBe(true)

    post.mockResolvedValueOnce({ status: 400, data: { errors: [{ message: 'Champ inconnu' }] } })
    await expect(gql('{ x }')).rejects.toThrow('Champ inconnu')
  })

  it('throws a readable error when the response is not GraphQL', async () => {
    post.mockResolvedValueOnce({ status: 500, data: '<html>Internal Server Error</html>' })
    await expect(gql('{ cards { id } }')).rejects.toThrow('HTTP 500')
  })

  it('sends the token as Bearer only when there is one', () => {
    const addToken = use.mock.calls[0]?.[0]

    localStorage.setItem(TOKEN_KEY, 'abc')
    expect(addToken?.({ headers: {} }).headers.Authorization).toBe('Bearer abc')

    localStorage.removeItem(TOKEN_KEY)
    expect(addToken?.({ headers: {} }).headers.Authorization).toBeUndefined()
  })
})
