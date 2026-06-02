import { vi } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock('../../../../services/psyeduService', () => ({
  fetchTopicsByModule: vi.fn().mockResolvedValue([]),
  fetchBlocksByTopic: vi.fn().mockResolvedValue([]),
}))

vi.mock('../../../../services/crisisPlanService', () => ({
  fetchCrisisPlanConfig: vi.fn().mockResolvedValue({
    practitionerMessage: '',
    copingCards: [],
    commitmentPhrase: '',
  }),
  saveCrisisPlanConfig: vi.fn().mockResolvedValue({ ok: true }),
  clearCrisisPlanConfigCache: vi.fn(),
}))

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { FieldRenderer } from './FieldRenderer'
import type { ContentField } from '../../../../services/moduleService'

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

  it('preview_kind inconnu retombe sur le fallback générique', () => {
    const { container } = render(
      <FieldRenderer
        preview_kind={'unknown' as never}
        fields={[field('step_title', { text_code: 'foo.bar' })]}
        expandedCard={null}
        onToggleCard={noop}
      />
    )
    expect(container.querySelector('ul.preview-fallback')).toBeTruthy()
    expect(container.querySelectorAll('li.preview-fallback__item')).toHaveLength(1)
  })

  it('preview_kind inconnu sans text_code affiche une erreur visible', () => {
    const { container } = render(
      <FieldRenderer
        preview_kind={'unknown' as never}
        fields={[field('mystery_type', { text_code: null })]}
        expandedCard={null}
        onToggleCard={noop}
      />
    )
    const err = container.querySelector('.field-error')
    expect(err).toBeTruthy()
    expect(err?.textContent).toContain('mystery_type')
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

describe('FieldRenderer — layout daily_checkin', () => {
  it('rend les onglets, la question, les options de statut et les notes', () => {
    const fields = [
      field('daily_checkin_config', {
        props: {
          engagement_event_type: 'SAVE_FOO',
          tab_today_label:    'm.tab_today',
          tab_history_label:  'm.tab_history',
          today_label:        'm.today',
          question:           'm.question',
          notes_label:        'm.notes',
          notes_placeholder:  'm.placeholder',
          save_label:         'm.save',
          history_empty_text: 'm.empty',
        },
      }),
      field('daily_status_option', {
        sort_order: 30,
        text_code: 'm.opt_taken',
        props: { value: 'taken', color: '#10B981', bg_color: '#ECFDF5' },
      }),
      field('daily_status_option', {
        sort_order: 31,
        text_code: 'm.opt_partial',
        props: { value: 'partial', color: '#F59E0B', bg_color: '#FFFBEB' },
      }),
      field('daily_status_option', {
        sort_order: 32,
        text_code: 'm.opt_missed',
        props: { value: 'missed', color: '#6B7280', bg_color: '#F3F4F6' },
      }),
    ]
    const { container } = render(
      <FieldRenderer preview_kind="daily_checkin" fields={fields} expandedCard={null} onToggleCard={noop} />
    )
    expect(container.querySelector('.preview-daily')).toBeTruthy()
    const tabs = container.querySelectorAll('[role="tab"]')
    expect(tabs).toHaveLength(2)
    expect(tabs[0].getAttribute('aria-selected')).toBe('true')
    expect(tabs[0].textContent).toBe('m.tab_today')
    expect(tabs[1].textContent).toBe('m.tab_history')
    expect(container.querySelector('.preview-daily__question')?.textContent).toBe('m.question')
    expect(container.querySelectorAll('.preview-daily__status')).toHaveLength(3)
    expect(container.querySelector('.preview-daily__notes-label')?.textContent).toBe('m.notes')
    expect(container.querySelector('.preview-daily__save-btn')?.textContent).toBe('m.save')
    expect(container.querySelector('.preview-daily__history-empty')?.textContent).toBe('m.empty')
  })

  it('trie les options par sort_order et applique color/bg_color', () => {
    const fields = [
      field('daily_status_option', {
        sort_order: 32,
        text_code: 'm.c',
        props: { value: 'c', color: '#111111', bg_color: '#222222' },
      }),
      field('daily_status_option', {
        sort_order: 30,
        text_code: 'm.a',
        props: { value: 'a', color: '#aaaaaa', bg_color: '#bbbbbb' },
      }),
    ]
    const { container } = render(
      <FieldRenderer preview_kind="daily_checkin" fields={fields} expandedCard={null} onToggleCard={noop} />
    )
    const pills = container.querySelectorAll<HTMLSpanElement>('.preview-daily__status')
    expect(pills[0].textContent).toBe('m.a')
    expect(pills[1].textContent).toBe('m.c')
    expect(pills[0].style.borderColor).toBeTruthy()
  })

  it('rend le footer_note dans un bloc info', () => {
    const fields = [
      field('daily_checkin_config', { props: { question: 'm.q' } }),
      field('footer_note', { text_code: 'm.foot' }),
    ]
    const { container } = render(
      <FieldRenderer preview_kind="daily_checkin" fields={fields} expandedCard={null} onToggleCard={noop} />
    )
    expect(container.querySelector('.preview-panel__info')).toBeTruthy()
    expect(container.querySelector('.preview-panel__footer')?.textContent).toBe('m.foot')
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
