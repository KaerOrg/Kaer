jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons')
jest.mock('../../../../../lib/dateUtils', () => ({
  formatDateFull: (s: string) => `full:${s}`,
}))

import { render, screen, fireEvent } from '@testing-library/react-native'
import { NarrativeRecordCard } from './NarrativeRecordCard'
import type { RecordColumnPart } from './RecordCard'
import type { NarrativeConfig } from './narrativeConfig'
import type { ContentField } from '@services/moduleService'
import type { FormEntry } from '../../../../../lib/database'

const t = (k: string) => k

function child(key: string, field_type: string, text_code: string): ContentField {
  return {
    id: `f.${key}`, module_id: 'beck_columns', section_id: null, parent_field_id: null,
    field_type, text_code, sort_order: 0, props: { key, unit: field_type === 'column_slider_field' ? '%' : '' }, children: [],
  }
}

const COLUMN_PARTS: RecordColumnPart[] = [
  { sectionId: 'situation', accent: '#0EA5E9', headerLabelCode: 'h.situation',
    textChildren: [child('situation', 'column_text_field', 'p.situation')], sliderChildren: [], timeChildren: [] },
  { sectionId: 'emotion', accent: '#8B5CF6', headerLabelCode: 'h.emotion',
    textChildren: [child('emotion', 'column_text_field', 'p.emotion')],
    sliderChildren: [child('emotion_intensity', 'column_slider_field', 'p.emotion_intensity')], timeChildren: [] },
  { sectionId: 'thought', accent: '#EF4444', headerLabelCode: 'h.thought',
    textChildren: [child('automatic_thought', 'column_text_field', 'p.thought')], sliderChildren: [], timeChildren: [] },
  { sectionId: 'evidence', accent: '#F59E0B', headerLabelCode: 'h.evidence',
    textChildren: [child('evidence_for', 'column_text_field', 'p.evidence')], sliderChildren: [], timeChildren: [] },
  { sectionId: 'rational', accent: '#6366F1', headerLabelCode: 'h.rational',
    textChildren: [child('rational_response', 'column_text_field', 'p.rational')], sliderChildren: [], timeChildren: [] },
  { sectionId: 'outcome', accent: '#EC4899', headerLabelCode: 'h.outcome',
    textChildren: [], sliderChildren: [child('outcome_intensity', 'column_slider_field', 'p.outcome_intensity')], timeChildren: [] },
]

const CONFIG: NarrativeConfig = {
  titleKey: 'situation',
  strikeKey: 'automatic_thought',
  strikeLabelCode: 'k.strike',
  reframeKey: 'rational_response',
  reframeLabelCode: 'k.reframe',
  expandLabelCode: 'k.expand',
  arc: {
    beforeKey: 'emotion_intensity', afterKey: 'outcome_intensity', captionKey: 'emotion',
    unit: '%', beforeLabelCode: 'k.before', afterLabelCode: 'k.after', todoLabelCode: 'k.todo',
  },
}

function makeEntry(values: FormEntry['values']): FormEntry {
  return { id: 'e1', module_id: 'beck_columns', values, created_at: '2026-07-05T10:00:00Z' }
}

function renderCard(entry: FormEntry, expanded = false) {
  const onToggleExpand = jest.fn()
  render(
    <NarrativeRecordCard
      entry={entry}
      columnParts={COLUMN_PARTS}
      config={CONFIG}
      expanded={expanded}
      showCompletion={false}
      completeKeys={[]}
      toCompleteLabel=""
      t={t}
      onToggleExpand={onToggleExpand}
      onEdit={jest.fn()}
      onDelete={jest.fn()}
    />,
  )
  return { onToggleExpand }
}

describe('NarrativeRecordCard', () => {
  it('affiche le titre (situation) et les pensées barrée / alternative', () => {
    renderCard(makeEntry({ situation: 'Peur dans le métro', automatic_thought: 'Je vais me faire agresser', rational_response: 'Le risque réel est faible' }))
    expect(screen.getByText('Peur dans le métro')).toBeTruthy()
    expect(screen.getByTestId('narrative-strike-e1')).toBeTruthy()
    expect(screen.getByText('Je vais me faire agresser')).toBeTruthy()
    expect(screen.getByTestId('narrative-reframe-e1')).toBeTruthy()
    expect(screen.getByText('Le risque réel est faible')).toBeTruthy()
  })

  it('affiche l\'arc avant → après quand les deux valeurs sont présentes', () => {
    renderCard(makeEntry({ situation: 'x', emotion_intensity: 90, outcome_intensity: 40, emotion: 'peur' }))
    expect(screen.getByTestId('arc-e1')).toBeTruthy()
    expect(screen.getByText('90%')).toBeTruthy()
    expect(screen.getByText('40%')).toBeTruthy()
    expect(screen.queryByTestId('arc-todo-e1')).toBeNull()
  })

  it('masque l\'arc et affiche l\'encart « à finir » quand la ré-évaluation manque', () => {
    renderCard(makeEntry({ situation: 'x', emotion_intensity: 100 }))
    expect(screen.queryByTestId('arc-e1')).toBeNull()
    expect(screen.getByTestId('arc-todo-e1')).toBeTruthy()
    expect(screen.getByText('k.todo')).toBeTruthy()
  })

  it('ni arc ni encart quand aucune valeur « avant »', () => {
    renderCard(makeEntry({ situation: 'x', automatic_thought: 'y' }))
    expect(screen.queryByTestId('arc-e1')).toBeNull()
    expect(screen.queryByTestId('arc-todo-e1')).toBeNull()
  })

  it('déplié : affiche les lignes étiquetées du raisonnement (hors titre/pensées/arc)', () => {
    renderCard(
      makeEntry({ situation: 'x', automatic_thought: 'a', rational_response: 'r', evidence_for: 'des faits', emotion_intensity: 90, outcome_intensity: 40 }),
      true,
    )
    // evidence_for n'est ni titre, ni pensée, ni clé d'arc → ligne étiquetée
    expect(screen.getByTestId('reasoning-evidence_for')).toBeTruthy()
    expect(screen.getByText('des faits')).toBeTruthy()
    // les clés d'arc (sliders) ne sont pas répétées en lignes
    expect(screen.queryByTestId('reasoning-emotion_intensity')).toBeNull()
    expect(screen.queryByTestId('reasoning-outcome_intensity')).toBeNull()
  })

  it('replié : pas de bloc raisonnement', () => {
    renderCard(makeEntry({ situation: 'x', evidence_for: 'des faits' }), false)
    expect(screen.queryByTestId('expanded-e1')).toBeNull()
    expect(screen.queryByTestId('reasoning-evidence_for')).toBeNull()
  })

  it('le lien de dépliage appelle onToggleExpand', () => {
    const { onToggleExpand } = renderCard(makeEntry({ situation: 'x' }))
    fireEvent.press(screen.getByTestId('expand-e1'))
    expect(onToggleExpand).toHaveBeenCalledWith('e1')
  })
})
