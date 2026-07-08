import { vi, describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithClient } from '../../../../../test/renderWithClient'
import { SafetyPlanLayout } from './SafetyPlanLayout'
import type { ContentField } from '@services/moduleService'

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }))
vi.mock('../../../../../contexts/usePatientView', () => ({ usePatientView: () => 'patient-1' }))
vi.mock('@services/crisisPlanService', () => ({
  fetchCrisisPlanConfig: vi.fn().mockResolvedValue({ practitionerMessage: '' }),
}))

const t = (k: string) => k

function field(over: Partial<ContentField>): ContentField {
  return {
    id: over.id ?? 'f',
    module_id: 'crisis_plan',
    section_id: over.section_id ?? null,
    parent_field_id: null,
    field_type: over.field_type ?? 'step_title',
    text_code: over.text_code ?? null,
    sort_order: over.sort_order ?? 0,
    props: over.props ?? {},
    children: [],
  }
}

const sections = new Map<string, ContentField[]>([
  ['step_1', [field({ id: 's1', field_type: 'step_title', text_code: 'modules.crisis_plan.step_1_title', section_id: 'step_1', props: { step_number: '1' } })]],
])

const unsectioned: ContentField[] = [
  field({ id: 'em', field_type: 'exercise_safety', text_code: 'num', sort_order: 130, props: { phone: '15', bgColor: '#0D9488', label_code: 'lbl' } }),
  field({ id: 'anchors', field_type: 'crisis_anchors_preview', sort_order: 70 }),
]

describe('SafetyPlanLayout (web)', () => {
  it('affiche le titre de consultation, le numéro d\'urgence et l\'étape', () => {
    renderWithClient(<SafetyPlanLayout sections={sections} unsectioned={unsectioned} moduleId="crisis_plan" t={t} />)
    expect(screen.getByText('modules.crisis_plan.consultation_title')).toBeInTheDocument()
    expect(screen.getByText('15')).toBeInTheDocument()
    expect(screen.getByText('modules.crisis_plan.step_1_title')).toBeInTheDocument()
    expect(screen.getByText('modules.crisis_plan.step_private_note')).toBeInTheDocument()
  })

  it('dérive les clés i18n du module_id (jamais en dur)', () => {
    renderWithClient(<SafetyPlanLayout sections={sections} unsectioned={unsectioned} moduleId="other_module" t={t} />)
    expect(screen.getByText('modules.other_module.consultation_title')).toBeInTheDocument()
  })
})
