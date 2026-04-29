import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { FieldRenderer } from './FieldRenderer'
import type { ContentField } from '../../lib/moduleService'

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }))

function f(overrides: Partial<ContentField>): ContentField {
  return {
    id: 'f1', module_id: 'mod1', section_id: null, parent_field_id: null,
    field_type: 'card_paragraph', text_code: null, sort_order: 0, props: {}, children: [],
    ...overrides,
  }
}

// ─── Cas nuls ─────────────────────────────────────────────────────────────────

describe('FieldRenderer — null cases', () => {
  it('retourne null pour coming_soon', () => {
    const { toJSON } = render(
      <FieldRenderer preview_kind="coming_soon" fields={[f({ text_code: 'test.text' })]} />,
    )
    expect(toJSON()).toBeNull()
  })

  it('retourne null quand fields est vide', () => {
    const { toJSON } = render(<FieldRenderer preview_kind="fields" fields={[]} />)
    expect(toJSON()).toBeNull()
  })

  it('retourne null pour un preview_kind inconnu', () => {
    const { toJSON } = render(
      <FieldRenderer preview_kind="inconnu" fields={[f({ text_code: 'test.text' })]} />,
    )
    expect(toJSON()).toBeNull()
  })
})

// ─── Filtrage ────────────────────────────────────────────────────────────────

describe('FieldRenderer — filtrage', () => {
  it('ne rend pas module_label ni module_description', () => {
    render(
      <FieldRenderer
        preview_kind="fields"
        fields={[
          f({ id: 'l1', field_type: 'module_label',       text_code: 'module.label' }),
          f({ id: 'd1', field_type: 'module_description', text_code: 'module.desc'  }),
          f({ id: 'r1', field_type: 'field_row',          text_code: 'row.label'    }),
        ]}
      />,
    )
    expect(screen.queryByText('module.label')).toBeNull()
    expect(screen.queryByText('module.desc')).toBeNull()
    expect(screen.getByText('row.label')).toBeTruthy()
  })
})

// ─── Layout : fields ──────────────────────────────────────────────────────────

describe('FieldRenderer — layout fields', () => {
  it('affiche les field_rows avec leur widget', () => {
    render(
      <FieldRenderer
        preview_kind="fields"
        fields={[f({ id: 'r1', field_type: 'field_row', text_code: 'row.label', props: { widget_type: 'time' } })]}
      />,
    )
    expect(screen.getByText('row.label')).toBeTruthy()
    expect(screen.getByText('22:00')).toBeTruthy()
  })

  it('affiche le footer_note separement', () => {
    render(
      <FieldRenderer
        preview_kind="fields"
        fields={[
          f({ id: 'r1', field_type: 'field_row',   text_code: 'row.label'   }),
          f({ id: 'ft', field_type: 'footer_note', text_code: 'footer.text' }),
        ]}
      />,
    )
    expect(screen.getByText('footer.text')).toBeTruthy()
  })
})

// ─── Layout : steps ──────────────────────────────────────────────────────────

describe('FieldRenderer — layout steps', () => {
  it('affiche le titre et le numero de chaque etape', () => {
    render(
      <FieldRenderer
        preview_kind="steps"
        fields={[
          f({ id: 't1', field_type: 'step_title', text_code: 'step.title',
              section_id: 's1', props: { color: '#4F46E5', step_number: '1' } }),
        ]}
      />,
    )
    expect(screen.getByText('step.title')).toBeTruthy()
    expect(screen.getByText('1')).toBeTruthy()
  })

  it('affiche le step_hint sous le titre', () => {
    render(
      <FieldRenderer
        preview_kind="steps"
        fields={[
          f({ id: 't1', field_type: 'step_title', text_code: 'step.title', section_id: 's1', props: { step_number: '1' } }),
          f({ id: 'h1', field_type: 'step_hint',  text_code: 'step.hint',  section_id: 's1' }),
        ]}
      />,
    )
    expect(screen.getByText('"step.hint"')).toBeTruthy()
  })

  it('ignore les sections sans step_title', () => {
    render(
      <FieldRenderer
        preview_kind="steps"
        fields={[f({ id: 'h1', field_type: 'step_hint', text_code: 'hint.text', section_id: 's1' })]}
      />,
    )
    expect(screen.queryByText('hint.text')).toBeNull()
  })

  it('ignore les fields sans section_id', () => {
    render(
      <FieldRenderer
        preview_kind="steps"
        fields={[f({ id: 't1', field_type: 'step_title', text_code: 'no.section' })]}
      />,
    )
    expect(screen.queryByText('no.section')).toBeNull()
  })
})

// ─── Layout : cards ──────────────────────────────────────────────────────────

describe('FieldRenderer — layout cards', () => {
  const titleField = f({ id: 'tit', field_type: 'card_title',     text_code: 'card.title', section_id: 'c1' })
  const bodyField  = f({ id: 'bod', field_type: 'card_paragraph', text_code: 'card.body',  section_id: 'c1' })

  it('affiche le titre, corps masque par defaut', () => {
    render(<FieldRenderer preview_kind="cards" fields={[titleField, bodyField]} />)
    expect(screen.getByText('card.title')).toBeTruthy()
    expect(screen.queryByText('card.body')).toBeNull()
  })

  it('developpe le corps au premier appui', () => {
    render(<FieldRenderer preview_kind="cards" fields={[titleField, bodyField]} />)
    fireEvent.press(screen.getByText('card.title'))
    expect(screen.getByText('card.body')).toBeTruthy()
  })

  it('referme la carte au deuxieme appui', () => {
    render(<FieldRenderer preview_kind="cards" fields={[titleField, bodyField]} />)
    fireEvent.press(screen.getByText('card.title'))
    fireEvent.press(screen.getByText('card.title'))
    expect(screen.queryByText('card.body')).toBeNull()
  })

  it('affiche le resume meme carte fermee', () => {
    const summaryField = f({ id: 'sum', field_type: 'card_summary', text_code: 'card.summary', section_id: 'c1' })
    render(<FieldRenderer preview_kind="cards" fields={[titleField, summaryField, bodyField]} />)
    expect(screen.getByText('card.summary')).toBeTruthy()
    expect(screen.queryByText('card.body')).toBeNull()
  })
})

// ─── Layout : grid2x2 ────────────────────────────────────────────────────────

describe('FieldRenderer — layout grid2x2', () => {
  it('affiche les titres des quadrants', () => {
    render(
      <FieldRenderer
        preview_kind="grid2x2"
        fields={[
          f({ id: 'q1', field_type: 'quadrant_title', text_code: 'quad.a', section_id: 'q1', props: { color: '#059669' } }),
          f({ id: 'q2', field_type: 'quadrant_title', text_code: 'quad.b', section_id: 'q2', props: { color: '#DC2626' } }),
        ]}
      />,
    )
    expect(screen.getByText('quad.a')).toBeTruthy()
    expect(screen.getByText('quad.b')).toBeTruthy()
  })

  it('affiche les sous-titres des quadrants', () => {
    render(
      <FieldRenderer
        preview_kind="grid2x2"
        fields={[
          f({ id: 'qt', field_type: 'quadrant_title',    text_code: 'q.title',    section_id: 'q1' }),
          f({ id: 'qs', field_type: 'quadrant_subtitle', text_code: 'q.subtitle', section_id: 'q1' }),
        ]}
      />,
    )
    expect(screen.getByText('q.subtitle')).toBeTruthy()
  })
})
