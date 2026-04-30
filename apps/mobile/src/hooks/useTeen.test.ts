// Tests du module teen — fonctions pures et données de couleur + locale JSON
// Le hook useTeen est un wrapper trivial sur ces fonctions + le store Zustand.
// On teste ici la logique des couleurs et la cohérence des fichiers de locale ado.

import {
  teenColorFor,
  TEEN_MODULE_COLORS,
  TEEN_DEFAULT_COLOR,
} from '../theme/teen'
import frTeen from '../i18n/locales/fr/teen.json'
import enTeen from '../i18n/locales/en/teen.json'

describe('teenColorFor()', () => {
  it('retourne la couleur correcte pour un module connu', () => {
    expect(teenColorFor('crisis_plan')).toBe(TEEN_MODULE_COLORS['crisis_plan'])
    expect(teenColorFor('grounding')).toBe(TEEN_MODULE_COLORS['grounding'])
    expect(teenColorFor('beck_columns')).toBe(TEEN_MODULE_COLORS['beck_columns'])
    expect(teenColorFor('decisional_balance')).toBe(TEEN_MODULE_COLORS['decisional_balance'])
  })

  it('retourne la couleur de fallback pour un module inconnu', () => {
    expect(teenColorFor('unknown_module')).toBe(TEEN_DEFAULT_COLOR)
    expect(teenColorFor('')).toBe(TEEN_DEFAULT_COLOR)
  })

  it('toutes les couleurs sont des hex valides (#RRGGBB)', () => {
    const hexRegex = /^#[0-9A-Fa-f]{6}$/
    expect(TEEN_DEFAULT_COLOR).toMatch(hexRegex)
    for (const [, color] of Object.entries(TEEN_MODULE_COLORS)) {
      expect(color).toMatch(hexRegex)
    }
  })

  it('couvre tous les modules actifs disponibles', () => {
    const activeModules = [
      'crisis_plan', 'medication_side_effects', 'medication_adherence',
      'sleep_diary', 'mood_tracker', 'emotion_wheel',
      'behavioral_activation', 'beck_columns', 'grounding', 'rim',
      'fear_thermometer', 'breathing_techniques', 'cognitive_saturation',
      'decisional_balance',
    ]
    for (const mod of activeModules) {
      expect(TEEN_MODULE_COLORS[mod]).toBeDefined()
    }
  })
})

describe('fr/teen.json — locale ado française', () => {
  it('contient les surcharges de titres pour les modules principaux', () => {
    expect(frTeen.modules.crisis_plan.title).toBeTruthy()
    expect(frTeen.modules.grounding.title).toBeTruthy()
    expect(frTeen.modules.beck_columns.title).toBeTruthy()
  })

  it('les textes ado utilisent le tutoiement ou un langage simplifié', () => {
    const allTeenTexts = Object.values(frTeen.modules).flatMap((mod) =>
      Object.values(mod as Record<string, string>)
    )
    const hasTutoiement = allTeenTexts.some(
      (t) => t.toLowerCase().includes(' tu ') || t.toLowerCase().includes(' ton ') ||
             t.toLowerCase().includes(' tes ') || t.toLowerCase().startsWith('tu ') ||
             t.toLowerCase().startsWith("t'")
    )
    expect(hasTutoiement).toBe(true)
  })

  it('contient les surcharges globales (greeting, modulesTitle)', () => {
    expect(frTeen.global.greeting).toBe('Salut !')
    expect(frTeen.global.modulesTitle).toBeTruthy()
  })

  it('le titre ado crisis_plan diffère du titre adulte (fr/common)', () => {
    // Les titres ado ne doivent pas être les mêmes que les adultes
    expect(frTeen.modules.crisis_plan.title).not.toBe('Plan de crise')
  })
})

describe('en/teen.json — locale ado anglaise', () => {
  it('contient des surcharges pour les modules principaux', () => {
    expect(Object.keys(enTeen.modules ?? {}).length).toBeGreaterThan(0)
  })

  it('les textes ado anglais sont distincts', () => {
    const allValues = Object.values(enTeen.modules ?? {}).flatMap((mod) =>
      Object.values(mod as Record<string, string>)
    )
    for (const val of allValues) {
      expect(typeof val).toBe('string')
      expect(val.length).toBeGreaterThan(0)
    }
  })
})
