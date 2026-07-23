import { describe, it, expect } from 'vitest'
import { rem, REM_BASE, injectTheme, fontSize } from '../theme'

// L'échelle reste numérique (px) dans @kaer/shared pour le mobile ; la couche web la
// convertit en `rem` (division par REM_BASE) au moment de l'injection. Ces tests
// verrouillent ce contrat : rem() correct, tous les paliers injectés en rem, base 16.
describe('theme — conversion px → rem (web)', () => {
  it('rem() divise par REM_BASE (16)', () => {
    expect(REM_BASE).toBe(16)
    expect(rem(16)).toBe('1rem')
    expect(rem(12)).toBe('0.75rem')
    expect(rem(11)).toBe('0.6875rem')
    expect(rem(28)).toBe('1.75rem')
  })

  it('injectTheme émet tous les paliers --font-size-* en rem', () => {
    injectTheme()
    const root = document.documentElement.style
    // Chaque palier de l'échelle a sa custom property, en rem (= valeur px / 16).
    for (const [name, px] of Object.entries(fontSize)) {
      expect(root.getPropertyValue(`--font-size-${name}`)).toBe(rem(px))
    }
    // Contrôle explicite des bornes de l'échelle.
    expect(root.getPropertyValue('--font-size-body')).toBe('1rem')
    expect(root.getPropertyValue('--font-size-xxs')).toBe('0.6875rem')
    expect(root.getPropertyValue('--font-size-h1')).toBe('1.75rem')
  })
})
