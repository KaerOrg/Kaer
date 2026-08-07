import { describe, it, expect } from 'vitest'
import {
  readEntryMode,
  sharedOptionsOf,
  optionsForQuestion,
  isScoredQuestion,
} from './scaleEntryMode'

interface TestField {
  field_type: string
  sort_order: number
  props: Record<string, string>
  children: TestField[]
}

function field(over: Partial<TestField> & Pick<TestField, 'field_type'>): TestField {
  return { sort_order: 0, props: {}, children: [], ...over }
}

const OPT_0 = field({ field_type: 'scale_option', sort_order: 10, props: { value: '0' } })
const OPT_1 = field({ field_type: 'scale_option', sort_order: 11, props: { value: '1' } })

describe('readEntryMode', () => {
  it('lit le mode déclaré par l\'échelle', () => {
    const fields = [field({ field_type: 'scale_meta', props: { entry_mode: 'one_per_screen' } })]
    expect(readEntryMode(fields)).toBe('one_per_screen')
  })

  it('retombe sur le mode défilant quand rien n\'est déclaré', () => {
    // Une configuration absente dégrade vers le comportement historique.
    expect(readEntryMode([field({ field_type: 'scale_meta' })])).toBe('scrolling_list')
    expect(readEntryMode([])).toBe('scrolling_list')
    expect(readEntryMode(null)).toBe('scrolling_list')
  })

  it('ignore une valeur inconnue plutôt que de casser l\'écran', () => {
    const fields = [field({ field_type: 'scale_meta', props: { entry_mode: 'carousel' } })]
    expect(readEntryMode(fields)).toBe('scrolling_list')
  })
})

describe('optionsForQuestion', () => {
  const shared = [OPT_0, OPT_1]

  it('applique les modalités du questionnaire quand l\'item n\'en porte pas', () => {
    const question = field({ field_type: 'scale_question', sort_order: 100 })
    expect(optionsForQuestion(question, shared)).toEqual(shared)
  })

  it('préfère les modalités PROPRES à l\'item', () => {
    // Sans cette règle, l'item 10 du PHQ-9 se rendrait avec les modalités de fréquence
    // des items 1 à 9, alors qu'il porte des degrés de difficulté : le praticien verrait
    // quatre réponses que son patient n'a jamais vues.
    const own = field({ field_type: 'scale_option', sort_order: 2, props: { value: '1' } })
    const question = field({ field_type: 'scale_question', sort_order: 100, children: [own] })

    expect(optionsForQuestion(question, shared)).toEqual([own])
  })

  it('ordonne les modalités propres par sort_order', () => {
    const second = field({ field_type: 'scale_option', sort_order: 2, props: { value: '1' } })
    const first = field({ field_type: 'scale_option', sort_order: 1, props: { value: '0' } })
    const question = field({ field_type: 'scale_question', sort_order: 100, children: [second, first] })

    expect(optionsForQuestion(question, shared)).toEqual([first, second])
  })

  it('ignore les enfants qui ne sont pas des modalités', () => {
    const note = field({ field_type: 'scale_instruction', sort_order: 1 })
    const question = field({ field_type: 'scale_question', sort_order: 100, children: [note] })

    expect(optionsForQuestion(question, shared)).toEqual(shared)
  })
})

describe('sharedOptionsOf', () => {
  it('trie les modalités du questionnaire par sort_order', () => {
    expect(sharedOptionsOf([OPT_1, OPT_0])).toEqual([OPT_0, OPT_1])
  })

  it('ignore tout ce qui n\'est pas une modalité', () => {
    expect(sharedOptionsOf([field({ field_type: 'scale_question', sort_order: 1 })])).toEqual([])
  })
})

describe('isScoredQuestion', () => {
  it('considère un item comme coté par défaut', () => {
    expect(isScoredQuestion(field({ field_type: 'scale_question' }))).toBe(true)
  })

  it('reconnaît un item posé mais hors score', () => {
    expect(isScoredQuestion(field({ field_type: 'scale_question', props: { scored: 'false' } }))).toBe(false)
  })
})
