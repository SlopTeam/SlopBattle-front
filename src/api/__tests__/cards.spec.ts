import { describe, it, expect, vi } from 'vitest'
import { getCard, getCards } from '@/api/cards'

const { gql } = vi.hoisted(() => ({
  gql: vi.fn<(query: string, variables?: Record<string, unknown>) => Promise<unknown>>(),
}))

vi.mock('@/api/client', () => ({ gql }))

describe('getCards', () => {
  it('returns the cards, without filter by default', async () => {
    gql.mockResolvedValueOnce({ cards: [{ id: '1' }] })
    await expect(getCards()).resolves.toEqual([{ id: '1' }])
    expect(gql.mock.lastCall?.[1]).toEqual({ filter: undefined })
  })

  it('sends category and type ids as numbers, as the back expects', async () => {
    gql.mockResolvedValueOnce({ cards: [] })
    await getCards({ rarityId: 2, categoryIds: ['3'], typeIds: ['4', '5'] })
    expect(gql.mock.lastCall?.[1]).toEqual({
      filter: { rarityId: 2, categoryIds: [3], typeIds: [4, 5] },
    })
  })
})

describe('getCard', () => {
  it('sends the id and returns the card', async () => {
    gql.mockResolvedValueOnce({ card: { id: '7' } })
    await expect(getCard('7')).resolves.toEqual({ id: '7' })
    expect(gql.mock.lastCall?.[1]).toEqual({ id: '7' })
  })
})
