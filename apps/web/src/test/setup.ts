import '@testing-library/jest-dom'
import { vi } from 'vitest'
import i18n from '../i18n'

// jsdom n'implémente pas matchMedia : stub par défaut (aucune media query active).
// Les tests qui veulent simuler `prefers-reduced-motion` surchargent cette valeur.
if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

await i18n.changeLanguage('fr')
