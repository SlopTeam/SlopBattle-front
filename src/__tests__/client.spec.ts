import { describe, it, expect, vi } from 'vitest'
import { gql } from '@/api/client'

const { post, config } = vi.hoisted(() => ({
  post: vi.fn<() => Promise<unknown>>(),
  config: {} as { validateStatus?: (status: number) => boolean },
}))

vi.mock('axios', () => ({
  default: {
    create: (c: typeof config) => {
      Object.assign(config, c)
      return { post }
    },
  },
}))

describe('gql', () => {
  it('renvoie data en cas de succès', async () => {
    post.mockResolvedValueOnce({ status: 200, data: { data: { cards: [] } } })
    await expect(gql('{ cards { id } }')).resolves.toEqual({ cards: [] })
  })

  it('lève le message GraphQL du back (200 ou 400)', async () => {
    // Sans ça, axios rejetterait le 400 avant qu'on lise le message GraphQL
    expect(config.validateStatus?.(400)).toBe(true)

    post.mockResolvedValueOnce({ status: 400, data: { errors: [{ message: 'Champ inconnu' }] } })
    await expect(gql('{ x }')).rejects.toThrow('Champ inconnu')
  })

  it('lève une erreur lisible si la réponse n’est pas du GraphQL', async () => {
    post.mockResolvedValueOnce({ status: 500, data: '<html>Internal Server Error</html>' })
    await expect(gql('{ cards { id } }')).rejects.toThrow('HTTP 500')
  })
})
