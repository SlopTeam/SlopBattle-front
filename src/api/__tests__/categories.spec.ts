import { describe, it, expect, vi } from 'vitest'
import { getCategories } from '@/api/categories'

const { gql } = vi.hoisted(() => ({ gql: vi.fn<() => Promise<unknown>>() }))

vi.mock('@/api/client', () => ({ gql }))

describe('getCategories', () => {
  it('returns the categories', async () => {
    gql.mockResolvedValueOnce({ categories: [{ id: '1', name: 'brainrot' }] })
    await expect(getCategories()).resolves.toEqual([{ id: '1', name: 'brainrot' }])
  })
})
