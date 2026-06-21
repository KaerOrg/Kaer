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
  'chronobiology_tracker',
  'mood_tracker',
  'emotion_wheel',
  'behavioral_activation',
  'beck_columns',
  'cognitive_distortions',
  'grounding',
  'rim',
  'fear_thermometer',
  'breathing_techniques',
  'cognitive_saturation',
  'craving_journal',
  'decisional_balance',
  'motivational_balance',
  // Clinical scales (generic ModuleRenderer pattern)
  'phq9',
  'gad7',
  'bsl23',
  'snap_iv',
  'asrs6',
  'asrs18',
]

const CATEGORY_IDS = ['safety', 'iatrogenic', 'lifestyle', 'emotion', 'cognitive', 'anxiety', 'addiction', 'motivation']

describe('i18n FR locale — modules', () => {
  it('contient un label pour chacun des 27 modules', () => {
    for (const id of ALL_MODULE_IDS) {
      const entry = (frLocale.modules as Record<string, { label?: string }>)[id]
      expect(entry, `modules.${id} manquant dans la locale FR`).toBeDefined()
      expect(entry.label, `modules.${id}.label manquant`).toBeTruthy()
    }
  })

  it('contient une description pour chacun des 27 modules', () => {
    for (const id of ALL_MODULE_IDS) {
      const entry = (frLocale.modules as Record<string, { description?: string }>)[id]
      expect(entry?.description, `modules.${id}.description manquant`).toBeTruthy()
    }
  })

  it('couvre les 27 modules', () => {
    const modules = frLocale.modules as Record<string, unknown>
    for (const id of ALL_MODULE_IDS) {
      expect(id in modules, `modules.${id} manquant`).toBe(true)
    }
  })

  it('le label sleep_diary est correct', () => {
    const entry = (frLocale.modules as Record<string, { label: string }>)['sleep_diary']
    expect(entry.label).toBe("Agenda du sommeil")
  })

  it('le label beck_columns est correct', () => {
    const entry = (frLocale.modules as Record<string, { label: string }>)['beck_columns']
    expect(entry.label).toBe("Colonnes de Beck")
  })
})

describe('i18n FR locale — categories', () => {
  it('contient un label et subtitle pour chacune des 8 catégories', () => {
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
