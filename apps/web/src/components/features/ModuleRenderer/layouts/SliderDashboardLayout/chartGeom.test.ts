import { describe, it, expect } from 'vitest'
import { ribbonLoggedMask, RIBBON_DAYS } from './chartGeom'

describe('chartGeom.ribbonLoggedMask', () => {
  it('retourne un masque de la longueur demandée', () => {
    expect(ribbonLoggedMask('mood_tracker', RIBBON_DAYS)).toHaveLength(RIBBON_DAYS)
    expect(ribbonLoggedMask('x', 7)).toHaveLength(7)
  })

  it('est déterministe (même seed → même masque)', () => {
    expect(ribbonLoggedMask('mood_tracker', RIBBON_DAYS))
      .toEqual(ribbonLoggedMask('mood_tracker', RIBBON_DAYS))
  })

  it('laisse des jours renseignés ET des jours vides (aucune valeur inventée sur tous les jours)', () => {
    const mask = ribbonLoggedMask('mood_tracker', RIBBON_DAYS)
    expect(mask.some(Boolean)).toBe(true)
    expect(mask.some(v => !v)).toBe(true)
    // ~1 jour sur 7 non renseigné : la majorité des jours reste saisie.
    expect(mask.filter(Boolean).length).toBeGreaterThan(RIBBON_DAYS / 2)
  })
})
