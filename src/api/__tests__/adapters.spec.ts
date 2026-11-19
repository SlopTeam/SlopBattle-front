import { describe, expect, it } from 'vitest'
import { toCard, toRarity } from '@/api/adapters'
import type { Card as ApiCard } from '@/api/cards'
import type { ApiRarity } from '@/api/rarities'

// Back order: by sortOrder, the most common first; the ids say nothing about the rank
const rarities: ApiRarity[] = ['Mid', 'Based', 'Sigma', 'Chad', 'Ascended', 'Goated'].map(
  (name, i) => ({ id: String(10 + i), name, sortOrder: i + 1 }),
)

describe('toRarity', () => {
  it('maps the n-th rarity of the list to the n-th style, common..goat', () => {
    expect(rarities.map(({ id }) => toRarity(id, rarities))).toEqual([
      'common',
      'uncommon',
      'rare',
      'epic',
      'legendary',
      'goat',
    ])
  })

  it('falls back to common for an unknown rarity or a missing list', () => {
    expect(toRarity('99', rarities)).toBe('common')
    expect(toRarity('12', [])).toBe('common')
  })

  it('falls back to common past the sixth rarity', () => {
    const seven = [...rarities, { id: '16', name: 'Extra', sortOrder: 7 }]
    expect(toRarity('16', seven)).toBe('common')
  })
})

describe('toCard', () => {
  const apiCard: ApiCard = {
    id: '12',
    title: 'Tralalero Tralala',
    description: null,
    imageUrl: 'https://cdn.example/12.png',
    rarity: { id: '12', name: 'Sigma', sortOrder: 3 },
    createdAt: '2026-11-18T10:00:00.000Z',
    updatedAt: '2026-11-18T10:00:00.000Z',
    categories: [{ id: '1', name: 'Brainrot' }],
    types: [{ id: '2', name: 'Créature' }],
  }

  it('converts the API shape to the UI shape', () => {
    expect(toCard(apiCard, rarities)).toEqual({
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
