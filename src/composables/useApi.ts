import { ref, shallowRef } from 'vue'

export function useApi<T>(request: () => Promise<T>) {
  const data = shallowRef<T>() // shallow: data is replaced as a whole, no need for deep reactivity
  const error = ref('')
  const loading = ref(false)

  // ponytail: when two reloads overlap the slowest wins; handle it once we reload on filter changes
  async function reload() {
    loading.value = true
    error.value = ''
    try {
      data.value = await request()
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
    } finally {
      loading.value = false
    }
  }

  void reload()
  return { data, error, loading, reload }
}
