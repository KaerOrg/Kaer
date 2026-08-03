import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { SafetySequenceLayout } from './SafetySequenceLayout'
import type { ContentField } from '@services/moduleService'

const t = (key: string) => key

function field(over: Partial<ContentField>): ContentField {
  return {
    id: over.id ?? 'f',
    module_id: over.module_id ?? 'crisis_plan',
    section_id: over.section_id ?? null,
    parent_field_id: null,
    field_type: over.field_type ?? 'step_title',
    text_code: over.text_code ?? null,
    sort_order: over.sort_order ?? 0,
    props: over.props ?? {},
    children: [],
  } as ContentField
}

const FIELDS: ContentField[] = [
  field({ id: 's1', section_id: 'step_1', sort_order: 1, text_code: 'modules.crisis_plan.step_1_title' }),
  field({ id: 's2', section_id: 'step_2', sort_order: 2, text_code: 'modules.crisis_plan.step_2_title' }),
  field({ id: 's3', section_id: 'step_3', sort_order: 3, text_code: 'modules.crisis_plan.step_3_title' }),
]

describe('SafetySequenceLayout (aperçu praticien)', () => {
  it('rend le parcours dans l\'ordre : arrivée, étapes, ressources, clôture', () => {
    render(<SafetySequenceLayout fields={FIELDS} t={t} moduleId="crisis_plan" />)
    expect(screen.getByText('modules.crisis_plan.sequence_home_title')).toBeInTheDocument()
    expect(screen.getByText('modules.crisis_plan.step_1_title')).toBeInTheDocument()
    expect(screen.getByText('modules.crisis_plan.sequence_resources_title')).toBeInTheDocument()
    expect(screen.getByText('modules.crisis_plan.sequence_closing_title')).toBeInTheDocument()
  })

  it('numérote les étapes avec la progression partagée avec le mobile', () => {
    render(<SafetySequenceLayout fields={FIELDS} t={t} moduleId="crisis_plan" />)
    expect(screen.getByText('1 / 3')).toBeInTheDocument()
    expect(screen.getByText('3 / 3')).toBeInTheDocument()
  })

  it('respecte l\'ordre de `sort_order`, pas l\'ordre du tableau', () => {
    const shuffled = [FIELDS[2], FIELDS[0], FIELDS[1]]
    render(<SafetySequenceLayout fields={shuffled} t={t} moduleId="crisis_plan" />)
    const titles = screen.getAllByRole('heading', { level: 3 }).map(h => h.textContent)
    expect(titles).toEqual([
      'modules.crisis_plan.sequence_home_title',
      'modules.crisis_plan.step_1_title',
      'modules.crisis_plan.step_2_title',
      'modules.crisis_plan.step_3_title',
      'modules.crisis_plan.sequence_resources_title',
      'modules.crisis_plan.sequence_closing_title',
    ])
  })

  it('ne rend rien quand aucune étape n\'est configurée', () => {
    const { container } = render(<SafetySequenceLayout fields={[]} t={t} moduleId="crisis_plan" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('dérive ses clés i18n du module reçu, jamais d\'un module en dur', () => {
    render(<SafetySequenceLayout fields={FIELDS} t={t} moduleId="autre_module" />)
    expect(screen.getByText('modules.autre_module.sequence_home_title')).toBeInTheDocument()
  })

  it('annonce que le parcours n\'enregistre rien (invariant MDR visible du praticien)', () => {
    render(<SafetySequenceLayout fields={FIELDS} t={t} moduleId="crisis_plan" />)
    expect(screen.getByText('modules.crisis_plan.sequence_preview_note')).toBeInTheDocument()
  })
})
