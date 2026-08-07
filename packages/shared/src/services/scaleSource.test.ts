import { describe, it, expect } from 'vitest'
import { readScaleSource } from './scaleSource'

const meta = (props: Record<string, string>) => [{ field_type: 'scale_meta', props }]

describe('readScaleSource', () => {
  it('lit la citation des auteurs et l\'attribution de traduction', () => {
    expect(readScaleSource(meta({
      instrument_citation: 'PHQ-9, Kroenke, Spitzer & Williams, 2001',
      translation_attribution: 'Traduction MAPI, sous licence',
    }))).toEqual({
      citation: 'PHQ-9, Kroenke, Spitzer & Williams, 2001',
      translationAttribution: 'Traduction MAPI, sous licence',
    })
  })

  it('rend null pour l\'attribution quand il n\'y a aucun tiers à attribuer', () => {
    // C'est le cas NOMINAL : une traduction produite par Kær n'attribue personne.
    expect(readScaleSource(meta({ instrument_citation: 'PHQ-9, Kroenke, 2001' })))
      .toEqual({ citation: 'PHQ-9, Kroenke, 2001', translationAttribution: null })
  })

  it('traite une valeur vide comme absente, pour ne pas rendre une ligne vide', () => {
    expect(readScaleSource(meta({
      instrument_citation: 'PHQ-9, Kroenke, 2001',
      translation_attribution: '   ',
    })).translationAttribution).toBeNull()
  })

  it('ne casse pas sans scale_meta, sans fields, ou sur null', () => {
    expect(readScaleSource([{ field_type: 'scale_question', props: {} }]))
      .toEqual({ citation: '', translationAttribution: null })
    expect(readScaleSource([])).toEqual({ citation: '', translationAttribution: null })
    expect(readScaleSource(null)).toEqual({ citation: '', translationAttribution: null })
    expect(readScaleSource(undefined)).toEqual({ citation: '', translationAttribution: null })
  })

  it('ne remonte JAMAIS la recommandation clinique', () => {
    // `reference_label` est un argument de crédibilité, pas une obligation de licence.
    // Les empiler abîmerait les deux : la mention légale prendrait un air d'argument
    // commercial, et l'argument finirait en petits caractères.
    const source = readScaleSource(meta({
      instrument_citation: 'PHQ-9, Kroenke, 2001',
      reference_label: 'Recommandé par NICE NG222',
    }))
    expect(JSON.stringify(source)).not.toContain('NICE')
  })
})
