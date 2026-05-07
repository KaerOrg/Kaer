import { vi } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { FieldRenderer } from './FieldRenderer'
import type { ContentField } from '../../services/moduleService'

function field(field_type: string, overrides: Partial<ContentField> = {}): ContentField {
  return {
    id: `${field_type}-${Math.random()}`,
    module_id: 'mod',
    section_id: null,
    parent_field_id: null,
    text_code: `${field_type}.text`,
    sort_order: 0,
    props: {},
    children: [],
    field_type,
    ...overrides,
  }
}

const noop = () => {}

describe('FieldRenderer — cas limites', () => {
  it('coming_soon rend null', () => {
    const { container } = render(
      <FieldRenderer preview_kind="coming_soon" fields={[field('step_title')]} expandedCard={null} onToggleCard={noop} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('liste de fields vide rend null', () => {
    const { container } = render(
      <FieldRenderer preview_kind="steps" fields={[]} expandedCard={null} onToggleCard={noop} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('preview_kind inconnu rend null', () => {
    const { container } = render(
      <FieldRenderer preview_kind="unknown" fields={[field('step_title')]} expandedCard={null} onToggleCard={noop} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('module_label et module_description sont filtrés', () => {
    const { container } = render(
      <FieldRenderer
        preview_kind="fields"
        fields={[field('module_label'), field('module_description'), field('field_row', { section_id: null })]}
        expandedCard={null}
        onToggleCard={noop}
      />
    )
    expect(container.querySelector('ul.preview-fields')).toBeTruthy()
  })
})

describe('FieldRenderer — layout steps', () => {
  it('rend un <ol class="preview-steps">', () => {
    const fields = [
      field('step_title', { section_id: 'step-1', props: { step_number: '1', color: '#6366F1' } }),
      field('step_hint', { section_id: 'step-1' }),
    ]
    const { container } = render(
      <FieldRenderer preview_kind="steps" fields={fields} expandedCard={null} onToggleCard={noop} />
    )
    expect(container.querySelector('ol.preview-steps')).toBeTruthy()
    expect(container.querySelectorAll('li.preview-step')).toHaveLength(1)
  })

  it('rend le footer_note sous les étapes', () => {
    const fields = [
      field('step_title', { section_id: 'step-1', props: { step_number: '1', color: '#6366F1' } }),
      field('footer_note', { text_code: 'footer.key' }),
    ]
    const { container } = render(
      <FieldRenderer preview_kind="steps" fields={fields} expandedCard={null} onToggleCard={noop} />
    )
    expect(container.querySelector('p.preview-panel__footer')?.textContent).toBe('footer.key')
  })
})

describe('FieldRenderer — layout fields', () => {
  it('rend un <ul class="preview-fields">', () => {
    const fields = [field('field_row'), field('field_row')]
    const { container } = render(
      <FieldRenderer preview_kind="fields" fields={fields} expandedCard={null} onToggleCard={noop} />
    )
    expect(container.querySelector('ul.preview-fields')).toBeTruthy()
    expect(container.querySelectorAll('li.preview-field')).toHaveLength(2)
  })

  it('rend le footer_note dans un bloc info', () => {
    const fields = [field('field_row'), field('footer_note', { text_code: 'note.key' })]
    const { container } = render(
      <FieldRenderer preview_kind="fields" fields={fields} expandedCard={null} onToggleCard={noop} />
    )
    expect(container.querySelector('.preview-panel__info')).toBeTruthy()
    expect(container.querySelector('.preview-panel__footer')?.textContent).toBe('note.key')
  })
})

describe('FieldRenderer — layout grid2x2', () => {
  it('rend un <div class="preview-grid2x2">', () => {
    const fields = [
      field('quadrant_title', { section_id: 'q1', props: { color: '#22C55E' } }),
      field('quadrant_subtitle', { section_id: 'q1' }),
    ]
    const { container } = render(
      <FieldRenderer preview_kind="grid2x2" fields={fields} expandedCard={null} onToggleCard={noop} />
    )
    expect(container.querySelector('div.preview-grid2x2')).toBeTruthy()
    expect(container.querySelectorAll('div.preview-quadrant')).toHaveLength(1)
  })
})

describe('FieldRenderer — layout cards', () => {
  it('rend un <div class="preview-cards">', () => {
    const fields = [
      field('card_title', { section_id: 'card-1', text_code: 'card.title' }),
      field('card_summary', { section_id: 'card-1', text_code: 'card.summary' }),
    ]
    const { container } = render(
      <FieldRenderer preview_kind="cards" fields={fields} expandedCard={null} onToggleCard={noop} />
    )
    expect(container.querySelector('div.preview-cards')).toBeTruthy()
  })

  it('le body de la card est caché si expandedCard !== sectionId', () => {
    const fields = [
      field('card_title', { section_id: 'card-1' }),
      field('card_paragraph', { section_id: 'card-1', text_code: 'body.text' }),
    ]
    const { container } = render(
      <FieldRenderer preview_kind="cards" fields={fields} expandedCard={null} onToggleCard={noop} />
    )
    expect(container.querySelector('.preview-card__body')).toBeNull()
  })

  it('le body s affiche quand expandedCard === sectionId', () => {
    const fields = [
      field('card_title', { section_id: 'card-1' }),
      field('card_paragraph', { section_id: 'card-1', text_code: 'body.text' }),
    ]
    const { container } = render(
      <FieldRenderer preview_kind="cards" fields={fields} expandedCard="card-1" onToggleCard={noop} />
    )
    expect(container.querySelector('.preview-card__body')).toBeTruthy()
  })

  it('onToggleCard est appelé au clic sur le header', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    const fields = [field('card_title', { section_id: 'card-1', text_code: 'card.title' })]
    render(
      <FieldRenderer preview_kind="cards" fields={fields} expandedCard={null} onToggleCard={onToggle} />
    )
    await user.click(screen.getByRole('button'))
    expect(onToggle).toHaveBeenCalledWith('card-1')
  })
})
