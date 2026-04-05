import { describe, it, expect } from 'vitest'
import { MODULE_LABELS, MODULE_DESCRIPTIONS } from './database.types'
import type { ModuleType } from './database.types'

const ALL_MODULES: ModuleType[] = [
  'sleep_diary',
  'beck_columns',
  'fear_thermometer',
  'emotion_wheel',
  'crisis_plan',
  'rim',
  'cognitive_saturation',
]

describe('MODULE_LABELS', () => {
  it('contient une entrée pour chaque ModuleType', () => {
    for (const type of ALL_MODULES) {
      expect(MODULE_LABELS[type]).toBeDefined()
      expect(typeof MODULE_LABELS[type]).toBe('string')
      expect(MODULE_LABELS[type].length).toBeGreaterThan(0)
    }
  })

  it('couvre exactement les 7 modules', () => {
    expect(Object.keys(MODULE_LABELS)).toHaveLength(7)
  })

  it('sleep_diary est labelisé "Agenda du sommeil"', () => {
    expect(MODULE_LABELS['sleep_diary']).toBe('Agenda du sommeil')
  })

  it('beck_columns est labelisé "Colonnes de Beck"', () => {
    expect(MODULE_LABELS['beck_columns']).toBe('Colonnes de Beck')
  })
})

describe('MODULE_DESCRIPTIONS', () => {
  it('contient une description pour chaque ModuleType', () => {
    for (const type of ALL_MODULES) {
      expect(MODULE_DESCRIPTIONS[type]).toBeDefined()
      expect(typeof MODULE_DESCRIPTIONS[type]).toBe('string')
      expect(MODULE_DESCRIPTIONS[type].length).toBeGreaterThan(0)
    }
  })

  it('couvre exactement les 7 modules', () => {
    expect(Object.keys(MODULE_DESCRIPTIONS)).toHaveLength(7)
  })

  it('chaque description est différente', () => {
    const descriptions = Object.values(MODULE_DESCRIPTIONS)
    const unique = new Set(descriptions)
    expect(unique.size).toBe(descriptions.length)
  })
})
