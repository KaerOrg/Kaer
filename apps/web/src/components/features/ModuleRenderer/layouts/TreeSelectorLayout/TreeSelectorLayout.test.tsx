import { vi } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { TreeSelectorLayout } from './TreeSelectorLayout'
import type { ContentField } from '@services/moduleService'

// `t` déterministe : renvoie la clé i18n telle quelle.
const t = (key: string) => key

function field(field_type: string, overrides: Partial<ContentField> = {}): ContentField {
  return {
    id: `${field_type}-${Math.random()}`,
    module_id: 'emotion_wheel',
    section_id: null,
    parent_field_id: null,
    text_code: null,
    sort_order: 0,
    props: {},
    children: [],
    field_type,
    ...overrides,
  }
}

function fields(): ContentField[] {
  return [
    field('tree_selector_config', { id: 'ew.cfg', props: {
      intro: 'modules.emotion_wheel.intro',
      new_btn: 'modules.emotion_wheel.new_btn',
      step_1_title: 'modules.emotion_wheel.step_1_title',
      step_1_hint: 'modules.emotion_wheel.step_1_hint',
      history_label: 'modules.emotion_wheel.history_label',
      empty_title: 'modules.emotion_wheel.empty_title',
      empty_text: 'modules.emotion_wheel.empty_text',
      intensity_title: 'modules.emotion_wheel.intensity_title',
      context_title: 'modules.emotion_wheel.context_title',
      notes_title: 'modules.emotion_wheel.notes_title',
      continue_btn: 'modules.emotion_wheel.continue_btn',
      save_btn: 'modules.emotion_wheel.save_btn',
      validate_here_btn: 'modules.emotion_wheel.validate_here_btn',
      enable_intensity: '1', enable_context: '1', enable_notes: '1', enable_early_validate: '1',
      intensity_min: '1', intensity_max: '10',
      context_opt_1: 'modules.emotion_wheel.context.work',
      context_opt_2: 'modules.emotion_wheel.context.family',
    } }),
    // Arbre IMBRIQUÉ (forme réelle renvoyée par fetchModuleFields : enfants dans .children)
    field('tree_node', {
      id: 'ew.joy', text_code: 'modules.emotion_wheel.node.joy', sort_order: 100,
      props: { color: '#F59E0B', emoji: '😊' },
      children: [
        field('tree_node', {
          id: 'ew.joy.plaisir', parent_field_id: 'ew.joy', text_code: 'modules.emotion_wheel.node.joy__plaisir', sort_order: 1,
          children: [
            field('tree_node', { id: 'ew.joy.plaisir.rejoui', parent_field_id: 'ew.joy.plaisir', text_code: 'modules.emotion_wheel.node.joy__plaisir__rejoui', sort_order: 1 }),
          ],
        }),
      ],
    }),
    field('tree_node', { id: 'ew.fear', text_code: 'modules.emotion_wheel.node.fear', sort_order: 130, props: { color: '#8B5CF6', emoji: '😨' } }),
  ]
}

const footer = field('footer_note', { id: 'ew.footer', text_code: 'modules.emotion_wheel.footer' })

function renderLayout() {
  return render(<TreeSelectorLayout fields={fields()} footer={footer} t={t} />)
}

describe('TreeSelectorLayout web (aperçu interactif, roue des émotions)', () => {
  it('historique : intro, bouton, état vide et footer', () => {
    const { container } = renderLayout()
    expect(screen.getByText('modules.emotion_wheel.intro')).toBeTruthy()
    expect(screen.getByText('modules.emotion_wheel.new_btn')).toBeTruthy()
    expect(container.querySelector('.ts-history-empty')).toBeTruthy()
    expect(screen.getByText('modules.emotion_wheel.footer')).toBeTruthy()
  })

  it('démarre le flux : grille des familles avec emoji et couleur', () => {
    const { container } = renderLayout()
    fireEvent.click(screen.getByText('modules.emotion_wheel.new_btn'))
    expect(container.querySelectorAll('.ts-primary')).toHaveLength(2)
    expect(screen.getByText('😊')).toBeTruthy()
    expect(screen.getByText('modules.emotion_wheel.node.joy')).toBeTruthy()
  })

  it('descend dans l\'arbre : famille → nuance', () => {
    const { container } = renderLayout()
    fireEvent.click(screen.getByText('modules.emotion_wheel.new_btn'))
    fireEvent.click(screen.getByText('modules.emotion_wheel.node.joy'))
    expect(container.querySelectorAll('.ts-option').length).toBeGreaterThan(0)
    expect(screen.getByText('modules.emotion_wheel.node.joy__plaisir')).toBeTruthy()
  })

  it('profondeur libre : « valider ici » dès la famille mène à l\'intensité', () => {
    const { container } = renderLayout()
    fireEvent.click(screen.getByText('modules.emotion_wheel.new_btn'))
    fireEvent.click(screen.getByText('modules.emotion_wheel.node.joy'))
    const validate = container.querySelector('.ts-validate')
    expect(validate).toBeTruthy()
    fireEvent.click(validate as Element)
    expect(container.querySelector('.ts-intensity')).toBeTruthy()
  })

  it('flux complet : feuille → intensité → contexte (chips)', () => {
    const { container } = renderLayout()
    fireEvent.click(screen.getByText('modules.emotion_wheel.new_btn'))
    fireEvent.click(screen.getByText('modules.emotion_wheel.node.joy'))
    fireEvent.click(screen.getByText('modules.emotion_wheel.node.joy__plaisir'))
    fireEvent.click(screen.getByText('modules.emotion_wheel.node.joy__plaisir__rejoui'))
    expect(container.querySelector('.ts-intensity')).toBeTruthy()
    fireEvent.click(container.querySelector('.ts-continue') as Element)
    expect(container.querySelectorAll('.ts-chip')).toHaveLength(2)
  })
})
