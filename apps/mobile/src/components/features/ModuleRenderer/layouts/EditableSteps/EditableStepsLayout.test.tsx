const mockGetPlanItems = jest.fn()
const mockSavePlanItem = jest.fn()
const mockDeletePlanItem = jest.fn()
jest.mock('@services/planItemService', () => ({
  getPlanItems: (...a: unknown[]) => mockGetPlanItems(...a),
  savePlanItem: (...a: unknown[]) => mockSavePlanItem(...a),
  deletePlanItem: (...a: unknown[]) => mockDeletePlanItem(...a),
}))

jest.mock('@services/contactsService', () => ({ pickContact: jest.fn() }))

const mockShowConfirm = jest.fn()
jest.mock('../../../../../contexts/ConfirmDialogContext', () => ({
  useConfirmDialog: () => ({ showConfirm: mockShowConfirm }),
}))

jest.mock('../../../../../hooks/useModuleT', () => ({
  useModuleTranslation: () => (k: string) => k,
}))

// Ancres (photos) et boutons d'urgence ont leurs propres tests — stubbés pour isoler le layout.
jest.mock('../../fields/CrisisAnchorsWidget', () => {
  const R = require('react')
  const { Text } = require('react-native')
  return { CrisisAnchorsWidget: () => R.createElement(Text, { testID: 'anchors-stub' }, 'anchors') }
})

jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons')

import React from 'react'
import { KeyboardAvoidingView } from 'react-native'
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import { EditableStepsLayout } from './EditableStepsLayout'
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
])

const UI_FIELDS: ContentField[] = [
  field({ id: 'em15', field_type: 'exercise_safety', text_code: 'modules.crisis_plan.emergency_samu', sort_order: 130, props: { phone: '15', bgColor: '#0D9488', label_code: 'modules.crisis_plan.emergency_samu_label' } }),
  field({ id: 'anchors', field_type: 'crisis_anchors_preview', sort_order: 70 }),
]

beforeEach(() => {
  jest.clearAllMocks()
  mockGetPlanItems.mockResolvedValue([])
  mockSavePlanItem.mockResolvedValue(undefined)
})

describe('EditableStepsLayout', () => {
  it('charge les items du plan au montage', async () => {
    render(<EditableStepsLayout sections={SECTIONS} uiFields={UI_FIELDS} moduleId="crisis_plan" />)
    await waitFor(() => expect(mockGetPlanItems).toHaveBeenCalledWith('crisis_plan'))
  })

  // Régression #143 : sans KeyboardAvoidingView, le clavier recouvre le champ d'ajout
  // et la frappe ne s'inscrit pas. Le wrapper doit envelopper tout le layout éditable.
  it('enveloppe le layout dans un KeyboardAvoidingView (issue #143)', async () => {
    render(<EditableStepsLayout sections={SECTIONS} uiFields={UI_FIELDS} moduleId="crisis_plan" />)
    await waitFor(() => expect(mockGetPlanItems).toHaveBeenCalled())
    expect(screen.UNSAFE_getByType(KeyboardAvoidingView)).toBeTruthy()
  })

  it('permet de saisir puis d\'enregistrer un nouvel item de texte dans une étape', async () => {
    render(<EditableStepsLayout sections={SECTIONS} uiFields={UI_FIELDS} moduleId="crisis_plan" />)
    await waitFor(() => expect(screen.getByTestId('step-header-1')).toBeTruthy())

    // Déplier l'étape, ouvrir le formulaire d'ajout, saisir puis valider.
    fireEvent.press(screen.getByTestId('step-header-1'))
    fireEvent.press(screen.getByTestId('step-1-add'))
    fireEvent.changeText(screen.getByTestId('step-1-new-input'), 'Appeler mes parents')
    fireEvent.press(screen.getByTestId('step-1-validate-new'))

    await waitFor(() =>
      expect(mockSavePlanItem).toHaveBeenCalledWith(
        expect.objectContaining({ section_id: 'step_1', text: 'Appeler mes parents' }),
      ),
    )
  })
})
