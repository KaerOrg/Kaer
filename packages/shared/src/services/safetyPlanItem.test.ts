import { describe, it, expect } from 'vitest'
import { parsePlanItemKind, readStepColumns, PLAN_ITEM_KINDS } from './safetyPlanItem'

describe('parsePlanItemKind', () => {
  it('reconnaît les deux natures admises', () => {
    expect(parsePlanItemKind('person')).toBe('person')
    expect(parsePlanItemKind('place')).toBe('place')
  })

  it('retourne null sur une valeur absente : un item d\'avant P-14 s\'édite sans casser', () => {
    expect(parsePlanItemKind(null)).toBeNull()
    expect(parsePlanItemKind(undefined)).toBeNull()
    expect(parsePlanItemKind('')).toBeNull()
  })

  it('retourne null sur une valeur inconnue plutôt que de la laisser passer', () => {
    expect(parsePlanItemKind('Person')).toBeNull()
    expect(parsePlanItemKind('personne')).toBeNull()
    expect(parsePlanItemKind('institution')).toBeNull()
  })

  it('expose les deux natures dans l\'ordre d\'affichage', () => {
    expect(PLAN_ITEM_KINDS).toEqual(['person', 'place'])
  })
})

describe('readStepColumns', () => {
  it('étape simple (1, 2) : le texte seul, aucune précision', () => {
    expect(readStepColumns({ step_number: '1' })).toEqual({
      kind: false, role: false, phone: false, note: false,
    })
  })

  it('étape mixte (3) : la nature s\'ajoute, car on y mélange personnes et lieux', () => {
    expect(readStepColumns({ step_number: '3', mixed_kind: 'true' })).toEqual({
      kind: true, role: true, phone: true, note: true,
    })
  })

  it('étape contactable (4, 5) : lien, téléphone et note, sans colonne de nature', () => {
    expect(readStepColumns({ step_number: '4', contactable: 'true' })).toEqual({
      kind: false, role: true, phone: true, note: true,
    })
  })

  it('étape 6 : aucune colonne, elle a son propre éditeur de mesures (PW-4)', () => {
    expect(readStepColumns({ step_number: '6', measure_editor: 'true' })).toEqual({
      kind: false, role: false, phone: false, note: false,
    })
  })

  it('l\'éditeur de mesures prime sur tout autre drapeau', () => {
    expect(readStepColumns({ measure_editor: 'true', contactable: 'true', mixed_kind: 'true' }))
      .toEqual({ kind: false, role: false, phone: false, note: false })
  })

  it('ne lit que la valeur exacte « true » : rien n\'est deviné', () => {
    expect(readStepColumns({ contactable: 'false' }).role).toBe(false)
    expect(readStepColumns({ contactable: '1' }).role).toBe(false)
  })
})
