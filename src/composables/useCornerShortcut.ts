import { onBeforeUnmount, onMounted } from 'vue'

/** Side of the square trigger zone in the top-right corner, in px */
export const CORNER_SIZE = 48

/**
 * Calls `onTrigger` when the mouse is in the top-right corner of the viewport while Ctrl is held,
 * whatever the order (move into the corner with Ctrl held, or press Ctrl once there).
 * Fires once per activation: the mouse must leave the corner or Ctrl be released to re-trigger.
 */
export function useCornerShortcut(onTrigger: () => void, size = CORNER_SIZE) {
  // Last known pointer position; off-screen until the first mousemove
  let x = -1
  let y = -1
  let active = false

  // clientWidth excludes the vertical scrollbar, unlike innerWidth
  const inCorner = () => x >= document.documentElement.clientWidth - size && y >= 0 && y <= size

  function update(ctrl: boolean) {
    const next = ctrl && inCorner()
    if (next && !active) onTrigger()
    active = next
  }

  function onMouseMove(event: MouseEvent) {
    x = event.clientX
    y = event.clientY
    update(event.ctrlKey)
  }
  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Control') update(true)
  }
  function onKeyUp(event: KeyboardEvent) {
    if (event.key === 'Control') update(false)
  }

  onMounted(() => {
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('keyup', onKeyUp)
  })
  onBeforeUnmount(() => {
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('keydown', onKeyDown)
    document.removeEventListener('keyup', onKeyUp)
  })
}
