import { describe, it, expect } from 'vitest'
import { MODULE_LABELS, MODULE_DESCRIPTIONS } from './database.types'
import type { ModuleType } from './database.types'

const ALL_MODULES: ModuleType[] = [
  // Sécurité & Gestion de Crise
  'crisis_plan',
  'therapeutic_commitment',
  'distress_tolerance',
  // Surveillance Iatrogénique & Somatique
  'medication_side_effects',
  'medication_adherence',
  'psychoeducation',
  // Hygiène de Vie & Rythmes Biologiques
  'sleep_diary',
  'diet_weight_psycho',
  'chronobiology_tracker',
  // Régulation Émotionnelle & Humeur
  'mood_tracker',
  'emotion_wheel',
  'behavioral_activation',
  // Restructuration Cognitive
  'beck_columns',
  'cognitive_distortions',
  'grounding',
  'rim',
  // Anxiété, Phobies & TOC
  'fear_thermometer',
  'exposure_hierarchy',
  'breathing_techniques',
  'cognitive_saturation',
  // Addictologie & Impulsivité
  'craving_journal',
  'decisional_balance',
]

describe('MODULE_LABELS', () => {
  it('contient une entrée pour chaque ModuleType', () => {
    for (const type of ALL_MODULES) {
      expect(MODULE_LABELS[type]).toBeDefined()
      expect(typeof MODULE_LABELS[type]).toBe('string')
      expect(MODULE_LABELS[type].length).toBeGreaterThan(0)
    }
  })

  it('couvre exactement les 22 modules', () => {
    expect(Object.keys(MODULE_LABELS)).toHaveLength(ALL_MODULES.length)
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

  it('couvre exactement les 22 modules', () => {
    expect(Object.keys(MODULE_DESCRIPTIONS)).toHaveLength(ALL_MODULES.length)
  })

  it('chaque description est différente', () => {
    const descriptions = Object.values(MODULE_DESCRIPTIONS)
    const unique = new Set(descriptions)
    expect(unique.size).toBe(descriptions.length)
  })
})
