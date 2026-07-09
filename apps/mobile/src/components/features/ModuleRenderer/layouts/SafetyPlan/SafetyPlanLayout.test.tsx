const mockPush = jest.fn()
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ push: mockPush }),
}))

const mockGetPlanItems = jest.fn()
jest.mock('@services/planItemService', () => ({
  getPlanItems: (...a: unknown[]) => mockGetPlanItems(...a),
}))

jest.mock('../../../../../hooks/useModuleT', () => ({
  useModuleTranslation: () => (k: string) => k,
}))

// Ancres et boutons d'urgence ont leurs propres tests — stubbés pour isoler le layout.
jest.mock('../../fields/CrisisAnchorsWidget', () => {
  const R = require('react')
  const { Text } = require('react-native')
  return { CrisisAnchorsWidget: () => R.createElement(Text, { testID: 'anchors-stub' }, 'anchors') }
})

jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons')

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import { Linking } from 'react-native'
import { SafetyPlanLayout } from './SafetyPlanLayout'
import type { ContentField } from '@services/moduleService'

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

const SECTIONS = new Map<string, ContentField[]>([
  ['step_1', [
    field({ id: 's1t', field_type: 'step_title', text_code: 'modules.crisis_plan.step_1_title', section_id: 'step_1', props: { step_number: '1', icon: 'alert', color: '#D97706', bgColor: '#FFFBEB' } }),
    field({ id: 's1h', field_type: 'step_hint', text_code: 'modules.crisis_plan.step_1_hint', section_id: 'step_1' }),
  ]],
  ['step_2', [
    field({ id: 's2t', field_type: 'step_title', text_code: 'modules.crisis_plan.step_2_title', section_id: 'step_2', props: { step_number: '2' } }),
  ]],
])

const UI_FIELDS: ContentField[] = [
  field({ id: 'em15', field_type: 'exercise_safety', text_code: 'modules.crisis_plan.emergency_samu', sort_order: 130, props: { phone: '15', bgColor: '#0D9488', label_code: 'modules.crisis_plan.emergency_samu_label' } }),
  field({ id: 'anchors', field_type: 'crisis_anchors_preview', sort_order: 70 }),
]

beforeEach(() => {
  jest.clearAllMocks()
  mockGetPlanItems.mockResolvedValue([])
  jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as never)
})

describe('SafetyPlanLayout', () => {
  it('charge les items du plan au montage', async () => {
    render(<SafetyPlanLayout sections={SECTIONS} uiFields={UI_FIELDS} moduleId="crisis_plan" />)
    await waitFor(() => expect(mockGetPlanItems).toHaveBeenCalledWith('crisis_plan'))
  })

  it('affiche le titre de consultation, les étapes et les ancres', async () => {
    render(<SafetyPlanLayout sections={SECTIONS} uiFields={UI_FIELDS} moduleId="crisis_plan" />)
    await waitFor(() => expect(screen.getByText('modules.crisis_plan.consultation_title')).toBeTruthy())
    expect(screen.getByText('modules.crisis_plan.step_1_title')).toBeTruthy()
    expect(screen.getByText('modules.crisis_plan.step_2_title')).toBeTruthy()
    expect(screen.getByTestId('anchors-stub')).toBeTruthy()
  })

  it('affiche les items saisis dans leur étape et un placeholder pour les étapes vides', async () => {
    mockGetPlanItems.mockResolvedValue([
      { id: 'i1', module_id: 'crisis_plan', section_id: 'step_1', text: 'Je me sens tendu', sort_order: 0, weight: null, created_at: '' },
    ])
    render(<SafetyPlanLayout sections={SECTIONS} uiFields={UI_FIELDS} moduleId="crisis_plan" />)
    await waitFor(() => expect(screen.getByText('Je me sens tendu')).toBeTruthy())
    // step_2 n'a aucun item → placeholder
    expect(screen.getByText('modules.crisis_plan.step_empty')).toBeTruthy()
  })

  it('appelle le numéro d\'urgence au tap', async () => {
    render(<SafetyPlanLayout sections={SECTIONS} uiFields={UI_FIELDS} moduleId="crisis_plan" />)
    await waitFor(() => expect(screen.getByTestId('emergency-15')).toBeTruthy())
    fireEvent.press(screen.getByTestId('emergency-15'))
    expect(Linking.openURL).toHaveBeenCalledWith('tel:15')
  })

  it('rend les items d\'une étape contactable comme contacts appelables (tel:)', async () => {
    const sections = new Map<string, ContentField[]>([
      ['step_4', [
        field({ id: 's4t', field_type: 'step_title', text_code: 'modules.crisis_plan.step_4_title', section_id: 'step_4', props: { step_number: '4', contactable: 'true' } }),
      ]],
    ])
    mockGetPlanItems.mockResolvedValue([
      { id: 'ct1', module_id: 'crisis_plan', section_id: 'step_4', text: 'Marie', sort_order: 0, weight: null, phone: '0102030405', contact_source: 'phonebook', created_at: '' },
    ])
    render(<SafetyPlanLayout sections={sections} uiFields={[]} moduleId="crisis_plan" />)
    await waitFor(() => expect(screen.getByText('Marie')).toBeTruthy())
    expect(screen.getByText('0102030405')).toBeTruthy()
    fireEvent.press(screen.getByTestId('contact-ct1-call'))
    expect(Linking.openURL).toHaveBeenCalledWith('tel:0102030405')
  })

  it('la roue crantée ouvre le module en mode édition', async () => {
    render(<SafetyPlanLayout sections={SECTIONS} uiFields={UI_FIELDS} moduleId="crisis_plan" />)
    await waitFor(() => expect(screen.getByTestId('safety-plan-configure')).toBeTruthy())
    fireEvent.press(screen.getByTestId('safety-plan-configure'))
    expect(mockPush).toHaveBeenCalledWith('ModuleContent', { moduleType: 'crisis_plan', previewKindOverride: 'editable_steps' })
  })
})
