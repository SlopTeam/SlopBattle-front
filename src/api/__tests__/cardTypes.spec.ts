import { describe, it, expect, vi } from 'vitest'
import { getCardTypes } from '@/api/cardTypes'

const { gql } = vi.hoisted(() => ({ gql: vi.fn<() => Promise<unknown>>() }))

vi.mock('@/api/client', () => ({ gql }))

describe('getCardTypes', () => {
  it('returns the card types', async () => {
    gql.mockResolvedValueOnce({ cardTypes: [{ id: '2', name: 'Feu' }] })
    await expect(getCardTypes()).resolves.toEqual([{ id: '2', name: 'Feu' }])
  })
})
