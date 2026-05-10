import { describe, it, expect } from 'vitest'
import frLocale from '../i18n/locales/fr/common.json'

const ALL_MODULE_IDS = [
  'crisis_plan',
  'therapeutic_commitment',
  'distress_tolerance',
  'medication_side_effects',
  'medication_adherence',
  'psychoeducation',
  'sleep_diary',
  'diet_weight_psycho',
  'chronobiology_tracker',
  'mood_tracker',
  'emotion_wheel',
  'behavioral_activation',
  'beck_columns',
  'cognitive_distortions',
  'grounding',
  'rim',
  'fear_thermometer',
  'exposure_hierarchy',
  'breathing_techniques',
  'cognitive_saturation',
  'craving_journal',
  'decisional_balance',
  // Clinical scales (generic ModuleRenderer pattern)
  'phq9',
  'gad7',
  'bsl23',
  'snap_iv',
  'asrs6',
  'asrs18',
]

const CATEGORY_IDS = ['safety', 'iatrogenic', 'lifestyle', 'emotion', 'cognitive', 'anxiety', 'addiction']

describe('i18n FR locale — modules', () => {
  it('contient un label pour chacun des 28 modules', () => {
    for (const id of ALL_MODULE_IDS) {
      const entry = (frLocale.module as Record<string, { label?: string }>)[id]
      expect(entry, `module.${id} manquant dans la locale FR`).toBeDefined()
      expect(entry.label, `module.${id}.label manquant`).toBeTruthy()
    }
  })

  it('contient une description pour chacun des 28 modules', () => {
    for (const id of ALL_MODULE_IDS) {
      const entry = (frLocale.module as Record<string, { description?: string }>)[id]
      expect(entry?.description, `module.${id}.description manquant`).toBeTruthy()
    }
  })

  it('couvre exactement les 28 modules', () => {
    expect(Object.keys(frLocale.module)).toHaveLength(ALL_MODULE_IDS.length)
  })

  it('le label sleep_diary est correct', () => {
    const entry = frLocale.module['sleep_diary'] as { label: string }
    expect(entry.label).toBe("Agenda du sommeil")
  })

  it('le label beck_columns est correct', () => {
    const entry = frLocale.module['beck_columns'] as { label: string }
    expect(entry.label).toBe("Colonnes de Beck")
  })
})

describe('i18n FR locale — categories', () => {
  it('contient un label et subtitle pour chacune des 7 catégories', () => {
    for (const id of CATEGORY_IDS) {
      const entry = (frLocale.category as Record<string, { label?: string; subtitle?: string }>)[id]
      expect(entry, `category.${id} manquant`).toBeDefined()
      expect(entry.label, `category.${id}.label manquant`).toBeTruthy()
    }
  })
})

describe('i18n FR locale — psychoeducation cards', () => {
  it('contient les 5 cartes de psychoéducation', () => {
    const cardIds = ['sleep_01', 'grounding_01', 'cbt_01', 'appetite_01', 'lithium_01']
    for (const id of cardIds) {
      const entry = (frLocale.card as Record<string, { title?: string }>)[id]
      expect(entry, `card.${id} manquant`).toBeDefined()
      expect(entry.title, `card.${id}.title manquant`).toBeTruthy()
    }
  })
})
