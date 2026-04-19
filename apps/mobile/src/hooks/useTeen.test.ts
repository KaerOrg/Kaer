// Tests du module teen — fonctions pures et données
// Le hook useTeen est un wrapper trivial sur ces fonctions + le store Zustand.
// On teste ici l'essentiel : la logique de résolution des textes et des couleurs.

import {
  teenColorFor,
  TEEN_MODULE_COLORS,
  TEEN_DEFAULT_COLOR,
  TEEN_MODULE_TEXTS,
  TEEN_GLOBAL,
} from '../theme/teen'

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
      'psychoeducation', 'sleep_diary', 'mood_tracker', 'emotion_wheel',
      'behavioral_activation', 'beck_columns', 'grounding', 'rim',
      'fear_thermometer', 'breathing_techniques', 'cognitive_saturation',
      'decisional_balance',
    ]
    for (const mod of activeModules) {
      expect(TEEN_MODULE_COLORS[mod]).toBeDefined()
    }
  })
})

describe('TEEN_MODULE_TEXTS', () => {
  it('chaque module a un titre adulte et un titre ado distincts', () => {
    const modulesWithTitle = Object.keys(TEEN_MODULE_TEXTS).filter(
      (k) => TEEN_MODULE_TEXTS[k]?.['title'] !== undefined
    )
    expect(modulesWithTitle.length).toBeGreaterThan(0)
    for (const mod of modulesWithTitle) {
      const entry = TEEN_MODULE_TEXTS[mod]['title']
      expect(entry.adult).toBeTruthy()
      expect(entry.teen).toBeTruthy()
      // Les textes adulte et ado doivent être différents
      expect(entry.adult).not.toBe(entry.teen)
    }
  })

  it('les textes ado utilisent le tutoiement ou un langage simplifié', () => {
    // Au moins quelques textes ado doivent contenir "tu" ou "ton" ou "tes"
    const allTeenTexts = Object.values(TEEN_MODULE_TEXTS).flatMap((module) =>
      Object.values(module).map((entry) => entry.teen.toLowerCase())
    )
    const hasTutoiement = allTeenTexts.some(
      (t) => t.includes(' tu ') || t.includes(' ton ') || t.includes(' tes ') || t.startsWith('tu ') || t.startsWith("t'")
    )
    expect(hasTutoiement).toBe(true)
  })

  it('aucun texte adulte ne contient de tutoiement', () => {
    const allAdultTexts = Object.values(TEEN_MODULE_TEXTS).flatMap((module) =>
      Object.values(module).map((entry) => entry.adult.toLowerCase())
    )
    // Les textes adultes ne doivent pas commencer par "tu" ou "t'as"
    for (const text of allAdultTexts) {
      expect(text.startsWith("tu ")).toBe(false)
      expect(text.startsWith("t'as")).toBe(false)
    }
  })

  it('couvre les modules crisis_plan, grounding et beck_columns', () => {
    expect(TEEN_MODULE_TEXTS['crisis_plan']).toBeDefined()
    expect(TEEN_MODULE_TEXTS['grounding']).toBeDefined()
    expect(TEEN_MODULE_TEXTS['beck_columns']).toBeDefined()
  })
})

describe('TEEN_GLOBAL', () => {
  it('contient les clés globales essentielles', () => {
    expect(TEEN_GLOBAL['greeting']).toBeDefined()
    expect(TEEN_GLOBAL['modulesTitle']).toBeDefined()
    expect(TEEN_GLOBAL['noModules']).toBeDefined()
  })

  it('le texte ado de greeting est "Salut !"', () => {
    expect(TEEN_GLOBAL['greeting'].teen).toBe('Salut !')
  })

  it('le texte adulte de greeting est "Bienvenue"', () => {
    expect(TEEN_GLOBAL['greeting'].adult).toBe('Bienvenue')
  })
})
