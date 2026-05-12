import { afterEach, describe, expect, it, vi } from 'vitest'
import { trackCalculatorCardClick } from './metrics'

describe('trackCalculatorCardClick', () => {
  const originalWindow = globalThis.window
  const originalFetch = globalThis.fetch

  afterEach(() => {
    if (originalWindow === undefined) {
      Reflect.deleteProperty(globalThis, 'window')
    } else {
      Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: originalWindow,
      })
    }

    if (originalFetch === undefined) {
      Reflect.deleteProperty(globalThis, 'fetch')
    } else {
      globalThis.fetch = originalFetch
    }
  })

  it('sends cal_card_click with calculator type when a calculator card is clicked', () => {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: {
        location: {
          hostname: 'dupe.bytedance.net',
          pathname: '/self_help/cal',
        },
      },
    })

    const fetchMock = vi.fn(() => Promise.resolve({} as Response))
    globalThis.fetch = fetchMock

    trackCalculatorCardClick('gross')

    expect(fetchMock).toHaveBeenCalledTimes(1)

    const [, requestInit] = fetchMock.mock.calls[0]
    const payload = JSON.parse(String(requestInit?.body)) as {
      name: string
      value: number
      tags: Record<string, string>
    }

    expect(payload.name).toBe('cal_card_click')
    expect(payload.value).toBe(1)
    expect(payload.tags.tool).toBe('cal')
    expect(payload.tags.path).toBe('/self_help/cal')
    expect(payload.tags.calculator_type).toBe('gross')
    expect(payload.tags.ts).toBeTruthy()
  })
})
