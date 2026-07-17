import { describe, it, expect } from 'vitest'
import { MOOD_WEB_DIMENSIONS, MOOD_MARKER_COLORS, MOOD_MARKER_TYPES } from './moodDimensions'

describe('moodDimensions', () => {
  it('mappe les 6 dimensions (clé FR service ↔ clé EN palette) avec couleurs et i18n', () => {
    expect(MOOD_WEB_DIMENSIONS.map(d => d.frKey)).toEqual([
      'humeur', 'energie', 'anxiete', 'plaisir', 'sommeil', 'alimentation',
    ])
    expect(MOOD_WEB_DIMENSIONS.map(d => d.enKey)).toEqual([
      'mood', 'energy', 'anxiety', 'pleasure', 'sleep', 'food',
    ])
    for (const d of MOOD_WEB_DIMENSIONS) {
      expect(d.colors.fill).toMatch(/^#[0-9A-Fa-f]{6}$/)
      expect(d.colors.mid).toMatch(/^#[0-9A-Fa-f]{6}$/)
      expect(d.labelKey).toBe(`evolution.mood_${d.frKey}`)
    }
  })

  it('couvre les 3 types de repère avec une couleur hex', () => {
    expect(MOOD_MARKER_TYPES).toEqual(['treatment', 'life_event', 'other'])
    for (const type of MOOD_MARKER_TYPES) {
      expect(MOOD_MARKER_COLORS[type]).toMatch(/^#[0-9A-Fa-f]{6}$/)
    }
  })
})
