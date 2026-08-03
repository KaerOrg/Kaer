import { describe, it, expect } from 'vitest'
import { buildTextPatch } from './planItemPatch'

describe('buildTextPatch', () => {
  it('porte la valeur saisie sur le champ demandé, et lui seul', () => {
    expect(buildTextPatch('role', 'ma voisine')).toEqual({ role: 'ma voisine' })
    expect(buildTextPatch('phone', '0600000000')).toEqual({ phone: '0600000000' })
    expect(buildTextPatch('note', 'il sait déjà')).toEqual({ note: 'il sait déjà' })
  })

  // Un item sans numéro n'est pas une erreur : vider le champ efface la précision, sans
  // rien reprocher et sans bloquer la saisie.
  it('vider une précision la remet à null', () => {
    expect(buildTextPatch('role', '')).toEqual({ role: null })
    expect(buildTextPatch('phone', '')).toEqual({ phone: null })
    expect(buildTextPatch('note', '')).toEqual({ note: null })
  })

  // Un item sans texte n'a plus d'existence : l'effacer par une sortie de champ serait
  // une suppression déguisée, sans annulation possible.
  it('le texte de l\'item ne devient jamais null, même vidé', () => {
    expect(buildTextPatch('text', '')).toEqual({ text: '' })
    expect(buildTextPatch('text', 'Yasmine')).toEqual({ text: 'Yasmine' })
  })
})
