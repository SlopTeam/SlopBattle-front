import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, type App } from 'vue'
import { CORNER_SIZE, useCornerShortcut } from '@/composables/useCornerShortcut'

const WIDTH = 1000
let app: App | undefined

function mount() {
  const onTrigger = vi.fn<() => void>()
  vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(WIDTH)
  app = createApp(
    defineComponent({
      setup() {
        useCornerShortcut(onTrigger)
        return () => null
      },
    }),
  )
  app.mount(document.createElement('div'))
  return onTrigger
}

const move = (clientX: number, clientY: number, ctrlKey = false) =>
  document.dispatchEvent(new MouseEvent('mousemove', { clientX, clientY, ctrlKey }))
const key = (type: 'keydown' | 'keyup', key = 'Control') =>
  document.dispatchEvent(new KeyboardEvent(type, { key }))

const CORNER = [WIDTH - 10, 10] as const

afterEach(() => {
  app?.unmount()
  vi.restoreAllMocks()
})

describe('useCornerShortcut', () => {
  it('triggers when moving into the corner with Ctrl held', () => {
    const onTrigger = mount()
    move(...CORNER, true)
    expect(onTrigger).toHaveBeenCalledOnce()
  })

  it('triggers when pressing Ctrl while in the corner', () => {
    const onTrigger = mount()
    move(...CORNER)
    expect(onTrigger).not.toHaveBeenCalled()
    key('keydown')
    expect(onTrigger).toHaveBeenCalledOnce()
  })

  it('does not trigger outside the corner', () => {
    const onTrigger = mount()
    move(WIDTH - CORNER_SIZE - 1, 10, true)
    move(WIDTH - 10, CORNER_SIZE + 1, true)
    key('keydown')
    expect(onTrigger).not.toHaveBeenCalled()
  })

  it('fires once per activation', () => {
    const onTrigger = mount()
    move(...CORNER, true)
    move(WIDTH - 5, 5, true)
    key('keydown') // key repeat
    expect(onTrigger).toHaveBeenCalledOnce()

    key('keyup')
    key('keydown')
    expect(onTrigger).toHaveBeenCalledTimes(2)
  })

  it('stops listening once unmounted', () => {
    const onTrigger = mount()
    app!.unmount()
    app = undefined
    move(...CORNER, true)
    expect(onTrigger).not.toHaveBeenCalled()
  })
})
