import {
  computed,
  onScopeDispose,
  reactive,
  ref,
  shallowRef,
  toValue,
  watch,
  type MaybeRefOrGetter,
} from 'vue'
import { toCard } from '@/api/adapters'
import { getCardsPage, type CardSort as ApiCardSort, type CardsFilter } from '@/api/cards'
import { ApiError } from '@/api/client'
import { getRarities, type ApiRarity } from '@/api/rarities'
import type { CardFilters, CardSort } from '@/composables/useCardFilters'
import type { Card } from '@/types/card'

/** Wait after the last keystroke before searching, in ms */
export const SEARCH_DELAY = 300

const API_SORT: Record<CardSort, ApiCardSort> = {
  'name-asc': 'TITLE_ASC',
  'name-desc': 'TITLE_DESC',
  'rarity-desc': 'RARITY_DESC',
  newest: 'NEWEST',
}

function toFilter(filters: CardFilters): CardsFilter {
  return {
    search: filters.query.trim() || undefined,
    // In the catalogue, the group filter holds a category id and the rarity filter a rarity id
    categoryIds: filters.set ? [filters.set] : undefined,
    typeIds: filters.type ? [filters.type] : undefined,
    rarityId: filters.rarity ? Number(filters.rarity) : undefined,
  }
}

function toMessage(error: unknown): string {
  return error instanceof ApiError && error.isUnauthorized
    ? 'Connectez-vous pour voir les cartes.'
    : 'Une erreur est survenue, réessayez.'
}

/**
 * Cards loaded from the back page by page: search, filters and sort run on the back.
 * `filters.set` is a category id, `filters.type` a card type id and `filters.rarity` a rarity id.
 * @param pageSize can be reactive, e.g. to always fill complete grid rows
 */
export function useCardsPage(pageSize: MaybeRefOrGetter<number> = 12) {
  const filters = reactive<CardFilters>({ query: '', set: '', type: '', rarity: '' })
  const sort = ref<CardSort>('name-asc')
  const page = ref(1)
  const size = computed(() => Math.max(1, toValue(pageSize)))

  const cards = shallowRef<Card[]>([])
  const total = ref(0)
  const pageCount = ref(1)
  const loading = ref(false)
  const error = ref('')
  /** Back rarities, the most common first; empty until loaded or when their request fails */
  const rarities = shallowRef<ApiRarity[]>([])
  let raritiesRequest: Promise<void> | undefined

  // Never rejects: without rarities the cards still show, in the plainest style
  function loadRarities() {
    raritiesRequest ??= getRarities().then(
      (list) => {
        rarities.value = list
      },
      () => {
        // Retried with the next page
        raritiesRequest = undefined
      },
    )
    return raritiesRequest
  }

  let controller: AbortController | null = null
  let timer: ReturnType<typeof setTimeout> | undefined

  async function load() {
    timer = undefined
    // Only the latest request may update the state
    controller?.abort()
    const current = new AbortController()
    controller = current
    loading.value = true
    error.value = ''
    try {
      const [result] = await Promise.all([
        getCardsPage(
          {
            filter: toFilter(filters),
            page: page.value,
            pageSize: size.value,
            sort: API_SORT[sort.value],
          },
          { signal: current.signal },
        ),
        // The card styles depend on the rarity ranks
        loadRarities(),
      ])
      if (current.signal.aborted) return
      cards.value = result.items.map((card) => toCard(card, rarities.value))
      total.value = result.total
      pageCount.value = result.pageCount
      // Past the last page (cards removed in the meantime): show the last one
      if (page.value > result.pageCount) page.value = result.pageCount
    } catch (caught) {
      if (current.signal.aborted) return
      cards.value = []
      total.value = 0
      pageCount.value = 1
      error.value = toMessage(caught)
    } finally {
      if (controller === current) loading.value = false
    }
  }

  /** Coalesces the changes of one tick (or of the typing burst) into one request */
  function schedule(delay = 0) {
    clearTimeout(timer)
    timer = setTimeout(() => void load(), delay)
  }

  watch(
    () => filters.query,
    () => {
      page.value = 1
      schedule(SEARCH_DELAY)
    },
  )
  watch([() => filters.set, () => filters.type, () => filters.rarity, sort], () => {
    page.value = 1
    schedule()
  })
  // Keep the first visible card on screen when the page size changes
  watch(size, (newSize, oldSize) => {
    const firstIndex = (page.value - 1) * oldSize
    page.value = Math.floor(firstIndex / newSize) + 1
    schedule()
  })
  // A pending request reads the page when it starts: don't cut a search delay short
  watch(page, () => {
    if (timer === undefined) schedule()
  })

  onScopeDispose(() => {
    clearTimeout(timer)
    controller?.abort()
  })

  schedule()

  return {
    filters,
    sort,
    page,
    cards,
    total,
    pageCount,
    loading,
    error,
    rarities,
    /** Loads the current page again, e.g. after an error */
    reload: load,
  }
}
