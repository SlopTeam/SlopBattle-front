import { describe, expect, it } from 'vitest'
import { nextTick, ref } from 'vue'
import { useCardFilters } from '@/composables/useCardFilters'
import type { Rarity } from '@/constants/rarity'
import type { Card } from '@/types/card'

function makeCard(id: number, name: string, rarity: Rarity, overrides: Partial<Card> = {}): Card {
  return {
    id,
    name,
    rarity,
    types: ['Créature'],
    description: '',
    set: 'Saison 1',
    categories: ['Saison 1'],
    createdAt: '2026-10-01',
    illustration: '',
    ...overrides,
  }
}

const cards = [
  makeCard(1, 'Éruption', 'common', { types: ['Sort', 'Feu'] }),
  makeCard(2, 'Dragon de feu', 'rare', { types: ['Créature', 'Feu'], createdAt: '2026-10-09' }),
  makeCard(3, 'Kraken', 'epic', { set: 'Saison 2', types: ['Créature', 'Eau'] }),
  makeCard(4, 'Phénix', 'legendary', { createdAt: '2026-10-20' }),
]

describe('useCardFilters', () => {
  it('sorts by name A→Z by default, ignoring accents', () => {
    const { filtered } = useCardFilters(cards)
    expect(filtered.value.map((c) => c.name)).toEqual([
      'Dragon de feu',
      'Éruption',
      'Kraken',
      'Phénix',
    ])
  })

  it('searches name, set and types without case or accents', () => {
    const { filters, filtered } = useCardFilters(cards)
    filters.query = 'eruption'
    expect(filtered.value.map((c) => c.id)).toEqual([1])
    filters.query = 'FEU'
    expect(filtered.value.map((c) => c.id)).toEqual([2, 1])
    filters.query = 'saison 2'
    expect(filtered.value.map((c) => c.id)).toEqual([3])
  })

  it('combines set, type and rarity filters', () => {
    const { filters, filtered } = useCardFilters(cards)
    filters.type = 'Créature'
    expect(filtered.value).toHaveLength(3)
    filters.set = 'Saison 1'
    expect(filtered.value.map((c) => c.id)).toEqual([2, 4])
    filters.rarity = 'legendary'
    expect(filtered.value.map((c) => c.id)).toEqual([4])
  })

  it('sorts by rarity (rarest first) and by date (newest first)', () => {
    const { sort, filtered } = useCardFilters(cards)
    sort.value = 'rarity-desc'
    expect(filtered.value.map((c) => c.rarity)).toEqual(['legendary', 'epic', 'rare', 'common'])
    sort.value = 'newest'
    expect(filtered.value.map((c) => c.id)).toEqual([4, 2, 1, 3])
  })

  it('paginates and goes back to page 1 when filters change', async () => {
    const { page, pageCards, pageCount, range, hasPrevious, hasNext, next, filters } =
      useCardFilters(cards, 3)
    expect(pageCount.value).toBe(2)
    expect(range.value).toEqual({ from: 1, to: 3 })
    expect(hasPrevious.value).toBe(false)

    next()
    expect(pageCards.value).toHaveLength(1)
    expect(range.value).toEqual({ from: 4, to: 4 })
    expect(hasNext.value).toBe(false)

    filters.query = 'k'
    await nextTick()
    expect(page.value).toBe(1)
  })

  it('follows a reactive page size and keeps the first visible card on screen', async () => {
    const pageSize = ref(2)
    const { page, range, next } = useCardFilters(cards, pageSize)
    next()
    expect(range.value).toEqual({ from: 3, to: 4 })

    // e.g. the grid went from 2 to 3 columns: card #3 must stay visible
    pageSize.value = 3
    await nextTick()
    expect(page.value).toBe(1)
    expect(range.value).toEqual({ from: 1, to: 3 })
  })

  it('reports an empty range when nothing matches', () => {
    const { filters, range, pageCount } = useCardFilters(cards)
    filters.query = 'introuvable'
    expect(range.value).toEqual({ from: 0, to: 0 })
    expect(pageCount.value).toBe(1)
  })
})
