import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, ref } from 'vue'
import { ApiError } from '@/api/client'
import { SEARCH_DELAY, useCardsPage } from '@/composables/useCardsPage'

const { getCardsPage } = vi.hoisted(() => ({
  getCardsPage: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
}))

vi.mock('@/api/cards', () => ({ getCardsPage }))

const apiCard = {
  id: '1',
  title: 'Skibidi',
  description: null,
  imageUrl: 'https://cdn.example/1.png',
  rarityId: 2,
  createdAt: '2026-11-18T10:00:00.000Z',
  updatedAt: '2026-11-18T10:00:00.000Z',
  categories: [],
  types: [],
}

function pageOf(total: number, pageCount = 1, page = 1) {
  return { items: total ? [apiCard] : [], total, page, pageCount }
}

function lastParams() {
  return getCardsPage.mock.lastCall?.[0]
}

describe('useCardsPage', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.useFakeTimers()
    getCardsPage.mockResolvedValue(pageOf(1))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // Fake timers also fake setImmediate, which flushPromises relies on
  async function settle(ms?: number) {
    if (ms === undefined) await vi.runOnlyPendingTimersAsync()
    else await vi.advanceTimersByTimeAsync(ms)
  }

  it('loads the first page and converts the cards', async () => {
    const { cards, total, loading } = useCardsPage(12)
    await settle()
    expect(getCardsPage).toHaveBeenCalledTimes(1)
    expect(lastParams()).toEqual({
      filter: {
        search: undefined,
        categoryIds: undefined,
        typeIds: undefined,
        rarityId: undefined,
      },
      page: 1,
      pageSize: 12,
      sort: 'TITLE_ASC',
    })
    expect(cards.value.map((card) => card.rarity)).toEqual(['uncommon'])
    expect(total.value).toBe(1)
    expect(loading.value).toBe(false)
  })

  it('sends the filters and the sort, and goes back to page 1', async () => {
    const { filters, sort, page } = useCardsPage(12)
    await settle()
    page.value = 3
    await settle()

    filters.set = '4'
    filters.type = '5'
    filters.rarity = 'legendary'
    sort.value = 'rarity-desc'
    await settle()

    expect(getCardsPage).toHaveBeenCalledTimes(3)
    expect(lastParams()).toEqual({
      filter: { search: undefined, categoryIds: ['4'], typeIds: ['5'], rarityId: 5 },
      page: 1,
      pageSize: 12,
      sort: 'RARITY_DESC',
    })
  })

  it('waits for the user to stop typing before searching', async () => {
    const { filters } = useCardsPage(12)
    await settle()
    filters.query = 'sk'
    await settle(100)
    filters.query = ' skibidi '
    await settle(SEARCH_DELAY - 1)
    expect(getCardsPage).toHaveBeenCalledTimes(1)
    await settle(1)
    expect(getCardsPage).toHaveBeenCalledTimes(2)
    expect(lastParams()).toMatchObject({ filter: { search: 'skibidi' } })
  })

  it('keeps the first visible card when the page size changes', async () => {
    getCardsPage.mockResolvedValue(pageOf(40, 4))
    const size = ref(12)
    const { page } = useCardsPage(size)
    await settle()
    page.value = 3 // cards 25..36
    await settle()
    size.value = 9
    await settle()
    expect(lastParams()).toMatchObject({ page: 3, pageSize: 9 })
  })

  it('goes to the last page when the requested one is past it', async () => {
    getCardsPage.mockResolvedValue(pageOf(5, 2, 2))
    const { page } = useCardsPage(12)
    page.value = 4
    await settle()
    expect(page.value).toBe(2)
    await settle()
    expect(lastParams()).toMatchObject({ page: 2 })
  })

  it('shows a French message when the user is not logged in', async () => {
    getCardsPage.mockRejectedValue(new ApiError('Unauthorized', { status: 401 }))
    const { cards, error } = useCardsPage(12)
    await settle()
    expect(error.value).toBe('Connectez-vous pour voir les cartes.')
    expect(cards.value).toEqual([])
  })

  it('shows the generic message for any other error', async () => {
    getCardsPage.mockRejectedValue(new Error('boom'))
    const { error } = useCardsPage(12)
    await settle()
    expect(error.value).toBe('Une erreur est survenue, réessayez.')
  })

  it('aborts the previous request and ignores its result', async () => {
    let resolveFirst: (value: unknown) => void = () => {}
    getCardsPage.mockImplementationOnce(() => new Promise((resolve) => (resolveFirst = resolve)))
    const { page, total } = useCardsPage(12)
    await settle()
    const firstOptions = getCardsPage.mock.calls[0]?.[1] as { signal: AbortSignal } | undefined

    getCardsPage.mockResolvedValueOnce(pageOf(30, 3, 2))
    page.value = 2
    await settle()
    expect(firstOptions?.signal.aborted).toBe(true)
    resolveFirst(pageOf(1))
    await settle()
    expect(total.value).toBe(30)
  })

  it('stops loading when its scope is disposed', async () => {
    const scope = effectScope()
    scope.run(() => useCardsPage(12))
    scope.stop()
    await settle()
    expect(getCardsPage).not.toHaveBeenCalled()
  })
})
