import { computed, reactive, ref, watch, type MaybeRefOrGetter, toValue } from 'vue'
import { RARITIES } from '@/constants/rarity'
import type { Card } from '@/types/card'

export type CardSort = 'name-asc' | 'name-desc' | 'rarity-desc' | 'newest'

/** Empty string = no filter */
export interface CardFilters {
  query: string
  set: string
  type: string
  rarity: string
}

/** Case- and accent-insensitive comparison key */
function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

const collator = new Intl.Collator('fr', { sensitivity: 'base' })

const comparators: Record<CardSort, (a: Card, b: Card) => number> = {
  'name-asc': (a, b) => collator.compare(a.name, b.name),
  'name-desc': (a, b) => collator.compare(b.name, a.name),
  'rarity-desc': (a, b) =>
    RARITIES.indexOf(b.rarity) - RARITIES.indexOf(a.rarity) || collator.compare(a.name, b.name),
  newest: (a, b) => b.createdAt.localeCompare(a.createdAt) || a.id - b.id,
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort(collator.compare)
}

/**
 * @param pageSize can be reactive, e.g. to always fill complete grid rows
 */
export function useCardFilters(
  cards: MaybeRefOrGetter<Card[]>,
  pageSize: MaybeRefOrGetter<number> = 12,
) {
  const filters = reactive<CardFilters>({ query: '', set: '', type: '', rarity: '' })
  const sort = ref<CardSort>('name-asc')
  const page = ref(1)
  const size = computed(() => Math.max(1, toValue(pageSize)))

  const sets = computed(() => uniqueSorted(toValue(cards).map((card) => card.set)))
  const types = computed(() => uniqueSorted(toValue(cards).flatMap((card) => card.types)))

  const filtered = computed(() => {
    const query = normalize(filters.query.trim())
    return toValue(cards)
      .filter((card) => {
        if (filters.set && card.set !== filters.set) return false
        if (filters.type && !card.types.includes(filters.type)) return false
        if (filters.rarity && card.rarity !== filters.rarity) return false
        if (!query) return true
        // The search field covers card name, set and types
        return [card.name, card.set, ...card.types].some((text) => normalize(text).includes(query))
      })
      .sort(comparators[sort.value])
  })

  const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / size.value)))
  const pageCards = computed(() =>
    filtered.value.slice((page.value - 1) * size.value, page.value * size.value),
  )
  /** 1-based range of the cards shown, e.g. { from: 13, to: 24 } */
  const range = computed(() => ({
    from: filtered.value.length ? (page.value - 1) * size.value + 1 : 0,
    to: Math.min(page.value * size.value, filtered.value.length),
  }))

  watch([filters, sort], () => {
    page.value = 1
  })

  // Keep the first visible card on screen when the page size changes
  watch(size, (newSize, oldSize) => {
    const firstIndex = (page.value - 1) * oldSize
    page.value = Math.floor(firstIndex / newSize) + 1
  })

  return {
    filters,
    sort,
    page,
    sets,
    types,
    filtered,
    pageCards,
    pageCount,
    range,
    hasPrevious: computed(() => page.value > 1),
    hasNext: computed(() => page.value < pageCount.value),
    previous: () => (page.value = Math.max(1, page.value - 1)),
    next: () => (page.value = Math.min(pageCount.value, page.value + 1)),
  }
}
