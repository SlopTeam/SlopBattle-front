import { onBeforeUnmount, ref, watch, type Ref } from 'vue'

/**
 * Live number of columns of a CSS grid (e.g. one using `repeat(auto-fill, …)`).
 * Keeps the last known value while the element is not rendered.
 */
export function useGridColumns(target: Readonly<Ref<HTMLElement | null>>, initial = 4) {
  const columns = ref(initial)

  function measure(element: HTMLElement) {
    const tracks = getComputedStyle(element).gridTemplateColumns.split(' ').filter(Boolean)
    if (tracks.length) columns.value = tracks.length
  }

  // Not available in every environment (e.g. jsdom)
  const observer =
    typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver((entries) =>
          entries.forEach((entry) => measure(entry.target as HTMLElement)),
        )

  watch(
    target,
    (element, previous) => {
      if (previous) observer?.unobserve(previous)
      if (element) {
        measure(element)
        observer?.observe(element)
      }
    },
    { immediate: true },
  )

  onBeforeUnmount(() => observer?.disconnect())

  return columns
}
