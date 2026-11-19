import { describe, it, expect, vi } from 'vitest'
import { getRarities } from '@/api/rarities'

const { gql } = vi.hoisted(() => ({ gql: vi.fn<() => Promise<unknown>>() }))

vi.mock('@/api/client', () => ({ gql }))

describe('getRarities', () => {
  it('returns the rarities', async () => {
    gql.mockResolvedValueOnce({ rarities: [{ id: '1', name: 'Mid', sortOrder: 1 }] })
    await expect(getRarities()).resolves.toEqual([{ id: '1', name: 'Mid', sortOrder: 1 }])
  })
})
