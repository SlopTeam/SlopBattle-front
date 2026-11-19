import { describe, expect, it } from 'vitest'
import { toCard, toRarity, toRarityId } from '@/api/adapters'
import type { Card as ApiCard } from '@/api/cards'

describe('toRarity', () => {
  it('maps rarityId 1..6 to common..goat', () => {
    expect([1, 2, 3, 4, 5, 6].map(toRarity)).toEqual([
      'common',
      'uncommon',
      'rare',
      'epic',
      'legendary',
      'goat',
    ])
  })

  it('falls back to common for an unknown id', () => {
    expect(toRarity(0)).toBe('common')
    expect(toRarity(7)).toBe('common')
  })

  it('is the inverse of toRarityId', () => {
    expect(toRarityId('common')).toBe(1)
    expect(toRarity(toRarityId('legendary'))).toBe('legendary')
  })
})

describe('toCard', () => {
  const apiCard: ApiCard = {
    id: '12',
    title: 'Tralalero Tralala',
    description: null,
    imageUrl: 'https://cdn.example/12.png',
    rarityId: 3,
    createdAt: '2026-11-18T10:00:00.000Z',
    updatedAt: '2026-11-18T10:00:00.000Z',
    categories: [{ id: '1', name: 'Brainrot' }],
    types: [{ id: '2', name: 'Créature' }],
  }

  it('converts the API shape to the UI shape', () => {
    expect(toCard(apiCard)).toEqual({
      id: 12,
      name: 'Tralalero Tralala',
      rarity: 'rare',
      types: ['Créature'],
      description: '',
      set: '',
      categories: ['Brainrot'],
      createdAt: '2026-11-18',
      illustration: 'https://cdn.example/12.png',
    })
  })
})
