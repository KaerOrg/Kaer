import {
  defusionReaderReducer,
  INITIAL_READER_STATE,
  type DefusionReaderState,
} from './defusionReaderMachine'

const measure = { discomfort: 8, belief: 7 }
const measureAfter = { discomfort: 5, belief: 6 }

function run(actions: Parameters<typeof defusionReaderReducer>[1][]): DefusionReaderState {
  return actions.reduce(defusionReaderReducer, INITIAL_READER_STATE)
}

describe('defusionReaderReducer — flux nominal A→E', () => {
  it('parcourt input → before → exercise → after → finish', () => {
    const s = run([
      { type: 'set_input', value: 'rater' },
      { type: 'submit_input' },
      { type: 'submit_before', measure },
      { type: 'finish_exercise', durationSeconds: 30 },
      { type: 'submit_after', measure: measureAfter },
    ])
    expect(s).toEqual({
      step: 'finish',
      wordOrThought: 'rater',
      before: measure,
      after: measureAfter,
      durationSeconds: 30,
    })
  })
})

describe('defusionReaderReducer — gardes de transition', () => {
  it('submit_input est ignoré tant que le mot est vide', () => {
    const s = defusionReaderReducer(INITIAL_READER_STATE, { type: 'submit_input' })
    expect(s.step).toBe('input')
  })

  it('submit_input est ignoré sur un mot uniquement fait d\'espaces', () => {
    const s = run([{ type: 'set_input', value: '   ' }, { type: 'submit_input' }])
    expect(s.step).toBe('input')
  })

  it('ignore une action hors de son étape (submit_after avant l\'exercice)', () => {
    const s = run([
      { type: 'set_input', value: 'mot' },
      { type: 'submit_input' },
      { type: 'submit_after', measure: measureAfter },
    ])
    expect(s.step).toBe('before')
    expect(s.after).toBeNull()
  })
})

describe('defusionReaderReducer — skip des mesures (null par paire)', () => {
  it('mesure avant passée = before null, jamais une dimension seule', () => {
    const s = run([
      { type: 'set_input', value: 'mot' },
      { type: 'submit_input' },
      { type: 'submit_before', measure: null },
    ])
    expect(s.before).toBeNull()
    expect(s.step).toBe('exercise')
  })

  it('mesure après passée = after null', () => {
    const s = run([
      { type: 'set_input', value: 'mot' },
      { type: 'submit_input' },
      { type: 'submit_before', measure },
      { type: 'finish_exercise', durationSeconds: 12 },
      { type: 'submit_after', measure: null },
    ])
    expect(s.after).toBeNull()
    expect(s.before).toEqual(measure)
    expect(s.step).toBe('finish')
  })
})

describe('defusionReaderReducer — arrêt anticipé', () => {
  it('enregistre la durée réelle transmise par l\'exercice (arrêt avant 30 s)', () => {
    const s = run([
      { type: 'set_input', value: 'mot' },
      { type: 'submit_input' },
      { type: 'submit_before', measure },
      { type: 'finish_exercise', durationSeconds: 9 },
    ])
    expect(s.durationSeconds).toBe(9)
    expect(s.step).toBe('after')
  })
})

describe('defusionReaderReducer — restart', () => {
  it('réinitialise entièrement pour « Refaire une séance »', () => {
    const s = run([
      { type: 'set_input', value: 'mot' },
      { type: 'submit_input' },
      { type: 'submit_before', measure },
      { type: 'finish_exercise', durationSeconds: 30 },
      { type: 'submit_after', measure: measureAfter },
      { type: 'restart' },
    ])
    expect(s).toEqual(INITIAL_READER_STATE)
  })
})
