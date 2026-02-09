import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(cleanup)

const win = globalThis.window ?? globalThis
Object.defineProperty(win, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})

if (typeof win.ResizeObserver === 'undefined') {
  win.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
}

if (typeof win.Element !== 'undefined' && !win.Element.prototype.scrollIntoView) {
  win.Element.prototype.scrollIntoView = () => {}
}
