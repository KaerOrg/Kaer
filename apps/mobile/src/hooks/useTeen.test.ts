// Tests du module teen — couleur par défaut + fichiers de locale ado.
// Les couleurs par module sont désormais stockées en BDD (modules.color),
// chargées dans authStore.moduleColors au login, et exposées via useTeen.teenColor().

import { TEEN_DEFAULT_COLOR } from '../theme/teen'
import frTeen from '../i18n/locales/fr/teen.json'
import enTeen from '../i18n/locales/en/teen.json'

describe('TEEN_DEFAULT_COLOR', () => {
  it('est un hex valide (#RRGGBB)', () => {
    expect(TEEN_DEFAULT_COLOR).toMatch(/^#[0-9A-Fa-f]{6}$/)
  })
})

function collectStringValues(node: unknown): string[] {
  if (typeof node === 'string') return [node]
  if (node && typeof node === 'object') {
    return Object.values(node as Record<string, unknown>).flatMap(collectStringValues)
  }
  return []
}

function collectStringEntries(node: unknown, prefix = ''): Array<[string, string]> {
  if (typeof node === 'string') return [[prefix, node]]
  if (node && typeof node === 'object') {
    return Object.entries(node as Record<string, unknown>).flatMap(([k, v]) =>
      collectStringEntries(v, prefix ? `${prefix}.${k}` : k)
    )
  }
  return []
}

describe('fr/teen.json — locale ado française', () => {
  it('contient les surcharges de titres pour les modules principaux', () => {
    expect(frTeen.modules.crisis_plan.title).toBeTruthy()
    expect(frTeen.modules.grounding.title).toBeTruthy()
    expect(frTeen.modules.beck_columns.title).toBeTruthy()
  })

  it('les textes ado utilisent le tutoiement ou un langage simplifié', () => {
    const allTeenTexts = collectStringValues(frTeen.modules)
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
    expect(frTeen.modules.crisis_plan.title).not.toBe('Plan de crise')
  })
})

describe('en/teen.json — locale ado anglaise', () => {
  it('contient des surcharges pour les modules principaux', () => {
    expect(Object.keys(enTeen.modules ?? {}).length).toBeGreaterThan(0)
  })

  it('les textes ado anglais sont non vides (hors description, vide par convention)', () => {
    // La clé `description` des échelles est volontairement '' (cf. règle métier).
    const entries = collectStringEntries(enTeen.modules ?? {})
    for (const [key, val] of entries) {
      expect(typeof val).toBe('string')
      if (key.endsWith('.description')) continue
      expect(val.length).toBeGreaterThan(0)
    }
  })
})
