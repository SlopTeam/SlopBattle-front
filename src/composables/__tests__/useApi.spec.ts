import { describe, expect, it } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { useApi } from '@/composables/useApi'

describe('useApi', () => {
  it('fills data and stops loading on success', async () => {
    const { data, loading, error } = useApi(() => Promise.resolve(['carte']))
    expect(loading.value).toBe(true)

    await flushPromises()
    expect(data.value).toEqual(['carte'])
    expect(loading.value).toBe(false)
    expect(error.value).toBe('')
  })

  it('exposes the back error message on failure', async () => {
    const { data, loading, error } = useApi(() => Promise.reject(new Error('Unauthorized')))

    await flushPromises()
    expect(error.value).toBe('Unauthorized')
    expect(data.value).toBeUndefined()
    expect(loading.value).toBe(false)
  })
})
