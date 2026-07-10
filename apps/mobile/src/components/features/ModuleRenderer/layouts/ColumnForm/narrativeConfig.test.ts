import { isWizardMode, readNarrativeConfig } from './narrativeConfig'

describe('isWizardMode', () => {
  it('true quand entry_mode = wizard', () => {
    expect(isWizardMode({ entry_mode: 'wizard' })).toBe(true)
  })
  it('false quand entry_mode absent ou différent', () => {
    expect(isWizardMode({})).toBe(false)
    expect(isWizardMode({ entry_mode: 'scroll' })).toBe(false)
    expect(isWizardMode(undefined)).toBe(false)
  })
})

describe('readNarrativeConfig', () => {
  it('retourne null si list_card_variant absent (carte générique)', () => {
    expect(readNarrativeConfig(undefined)).toBeNull()
    expect(readNarrativeConfig({})).toBeNull()
    expect(readNarrativeConfig({ list_card_variant: 'dots' })).toBeNull()
  })

  it('lit les clés récit quand list_card_variant = narrative', () => {
    const cfg = readNarrativeConfig({
      list_card_variant: 'narrative',
      narrative_title_key: 'situation',
      narrative_strike_key: 'automatic_thought',
      narrative_strike_label: 'k.strike',
      narrative_reframe_key: 'rational_response',
      narrative_reframe_label: 'k.reframe',
      narrative_expand_label: 'k.expand',
    })
    expect(cfg).not.toBeNull()
    expect(cfg?.titleKey).toBe('situation')
    expect(cfg?.strikeKey).toBe('automatic_thought')
    expect(cfg?.strikeLabelCode).toBe('k.strike')
    expect(cfg?.reframeKey).toBe('rational_response')
    expect(cfg?.expandLabelCode).toBe('k.expand')
    expect(cfg?.arc).toBeNull()
  })

  it('construit l\'arc quand arc_before_key ET arc_after_key sont présents', () => {
    const cfg = readNarrativeConfig({
      list_card_variant: 'narrative',
      arc_before_key: 'emotion_intensity',
      arc_after_key: 'outcome_intensity',
      arc_caption_key: 'emotion',
      arc_unit: '%',
      arc_before_label: 'k.before',
      arc_after_label: 'k.after',
      arc_todo_label: 'k.todo',
    })
    expect(cfg?.arc).toEqual({
      beforeKey: 'emotion_intensity',
      afterKey: 'outcome_intensity',
      captionKey: 'emotion',
      unit: '%',
      beforeLabelCode: 'k.before',
      afterLabelCode: 'k.after',
      todoLabelCode: 'k.todo',
    })
  })

  it('arc null si une seule des deux clés est présente', () => {
    expect(
      readNarrativeConfig({ list_card_variant: 'narrative', arc_before_key: 'x' })?.arc,
    ).toBeNull()
    expect(
      readNarrativeConfig({ list_card_variant: 'narrative', arc_after_key: 'y' })?.arc,
    ).toBeNull()
  })

  it('captionKey null quand arc_caption_key absent', () => {
    const cfg = readNarrativeConfig({
      list_card_variant: 'narrative',
      arc_before_key: 'a',
      arc_after_key: 'b',
    })
    expect(cfg?.arc?.captionKey).toBeNull()
    expect(cfg?.arc?.unit).toBe('')
  })
})
