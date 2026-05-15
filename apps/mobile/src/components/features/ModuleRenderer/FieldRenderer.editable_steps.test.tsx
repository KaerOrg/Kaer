jest.mock('../../hooks/useTeen', () => ({
  useTeen: () => ({ isTeenMode: false, tt: () => '', tg: () => '', teenColor: () => undefined }),
}))

jest.mock('../../services/engagementService', () => ({ logEvent: jest.fn() }))
jest.mock('../../store/authStore', () => ({ useAuthStore: () => null }))

jest.mock('../../lib/database', () => ({
  getAllPlanItemsForModule: jest.fn().mockResolvedValue([]),
  savePlanItem: jest.fn().mockResolvedValue(undefined),
  deletePlanItem: jest.fn().mockResolvedValue(undefined),
  generateId: jest.fn().mockReturnValue('test-id-plan'),
}))

jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons')
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }))

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import { Linking } from 'react-native'
import { FieldRenderer } from './FieldRenderer'
import * as database from '../../../lib/database'
import type { ContentField } from '../../../services/moduleService'

jest.setTimeout(15000)

// ─── Données de test ──────────────────────────────────────────────────────────

function makeField(overrides: Partial<ContentField>): ContentField {
  return {
    id: overrides.id ?? 'field-id',
    module_id: 'crisis_plan',
    section_id: overrides.section_id ?? null,
    parent_field_id: null,
    field_type: overrides.field_type ?? 'step_title',
    text_code: overrides.text_code ?? null,
    sort_order: overrides.sort_order ?? 0,
    props: overrides.props ?? {},
    children: [],
  }
}

const MOCK_FIELDS: ContentField[] = [
  makeField({ id: 'step_1.title', field_type: 'step_title', text_code: 'modules.crisis_plan.step_1_title', section_id: 'step_1', sort_order: 10, props: { step_number: '1', color: '#D97706', bgColor: '#FFFBEB', icon: 'alert-circle-outline' } }),
  makeField({ id: 'step_1.hint',  field_type: 'step_hint',  text_code: 'modules.crisis_plan.step_1_hint',  section_id: 'step_1', sort_order: 11, props: { step_number: '1' } }),
  makeField({ id: 'step_2.title', field_type: 'step_title', text_code: 'modules.crisis_plan.step_2_title', section_id: 'step_2', sort_order: 20, props: { step_number: '2', color: '#059669', bgColor: '#ECFDF5', icon: 'heart-pulse' } }),
  makeField({ id: 'step_2.hint',  field_type: 'step_hint',  text_code: 'modules.crisis_plan.step_2_hint',  section_id: 'step_2', sort_order: 21, props: { step_number: '2' } }),
  makeField({ id: 'em_15',   field_type: 'exercise_safety', text_code: 'modules.crisis_plan.emergency_samu',  section_id: null, sort_order: 130, props: { phone: '15',   bgColor: '#0D9488', label_code: 'modules.crisis_plan.emergency_samu_label' } }),
  makeField({ id: 'em_3114', field_type: 'exercise_safety', text_code: 'modules.crisis_plan.emergency_3114', section_id: null, sort_order: 140, props: { phone: '3114', bgColor: '#7C3AED', label_code: 'modules.crisis_plan.emergency_3114_label' } }),
]

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('FieldRenderer — editable_steps (EditableStepsLayout)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as never)
    ;(database.getAllPlanItemsForModule as jest.Mock).mockResolvedValue([])
  })

  it('charge les items du module au montage', async () => {
    render(<FieldRenderer preview_kind="editable_steps" fields={MOCK_FIELDS} moduleId="crisis_plan" />)
    await waitFor(() => {
      expect(database.getAllPlanItemsForModule).toHaveBeenCalledWith('crisis_plan')
    })
  })

  it('affiche les en-têtes des étapes après chargement', async () => {
    render(<FieldRenderer preview_kind="editable_steps" fields={MOCK_FIELDS} moduleId="crisis_plan" />)
    await waitFor(() => expect(screen.getByTestId('step-header-1')).toBeTruthy())
    expect(screen.getByTestId('step-header-2')).toBeTruthy()
  })

  it('développe/réduit une étape au tap sur son en-tête', async () => {
    render(<FieldRenderer preview_kind="editable_steps" fields={MOCK_FIELDS} moduleId="crisis_plan" />)
    await waitFor(() => expect(screen.getByTestId('step-header-1')).toBeTruthy())

    fireEvent.press(screen.getByTestId('step-header-1'))
    await waitFor(() => expect(screen.getByTestId('step-1-add')).toBeTruthy())

    fireEvent.press(screen.getByTestId('step-header-1'))
    await waitFor(() => expect(screen.queryByTestId('step-1-add')).toBeNull())
  })

  it("affiche le formulaire d'ajout et appelle savePlanItem avec le bon contenu", async () => {
    render(<FieldRenderer preview_kind="editable_steps" fields={MOCK_FIELDS} moduleId="crisis_plan" />)
    await waitFor(() => expect(screen.getByTestId('step-header-1')).toBeTruthy())

    fireEvent.press(screen.getByTestId('step-header-1'))
    await waitFor(() => expect(screen.getByTestId('step-1-add')).toBeTruthy())
    fireEvent.press(screen.getByTestId('step-1-add'))

    fireEvent.changeText(screen.getByTestId('step-1-new-input'), 'Respirer profondément')
    fireEvent.press(screen.getByTestId('step-1-validate-new'))

    await waitFor(() => {
      expect(database.savePlanItem).toHaveBeenCalledWith(
        expect.objectContaining({ module_id: 'crisis_plan', section_id: 'step_1', text: 'Respirer profondément' })
      )
    })
  })

  it("n'appelle pas savePlanItem si le texte est vide", async () => {
    render(<FieldRenderer preview_kind="editable_steps" fields={MOCK_FIELDS} moduleId="crisis_plan" />)
    await waitFor(() => expect(screen.getByTestId('step-header-1')).toBeTruthy())

    fireEvent.press(screen.getByTestId('step-header-1'))
    await waitFor(() => expect(screen.getByTestId('step-1-add')).toBeTruthy())
    fireEvent.press(screen.getByTestId('step-1-add'))
    fireEvent.press(screen.getByTestId('step-1-validate-new'))

    expect(database.savePlanItem).not.toHaveBeenCalled()
  })

  it('masque le formulaire en appuyant sur Annuler', async () => {
    render(<FieldRenderer preview_kind="editable_steps" fields={MOCK_FIELDS} moduleId="crisis_plan" />)
    await waitFor(() => expect(screen.getByTestId('step-header-1')).toBeTruthy())

    fireEvent.press(screen.getByTestId('step-header-1'))
    await waitFor(() => expect(screen.getByTestId('step-1-add')).toBeTruthy())
    fireEvent.press(screen.getByTestId('step-1-add'))

    expect(screen.getByTestId('step-1-new-input')).toBeTruthy()
    fireEvent.press(screen.getByTestId('step-1-cancel-new'))
    expect(screen.queryByTestId('step-1-new-input')).toBeNull()
  })

  it('affiche les boutons d\'urgence et appelle Linking.openURL sur le 15', async () => {
    render(<FieldRenderer preview_kind="editable_steps" fields={MOCK_FIELDS} moduleId="crisis_plan" />)
    await waitFor(() => expect(screen.getByTestId('emergency-15')).toBeTruthy())

    fireEvent.press(screen.getByTestId('emergency-15'))
    expect(Linking.openURL).toHaveBeenCalledWith('tel:15')
  })

  it('appelle Linking.openURL avec le 3114', async () => {
    render(<FieldRenderer preview_kind="editable_steps" fields={MOCK_FIELDS} moduleId="crisis_plan" />)
    await waitFor(() => expect(screen.getByTestId('emergency-3114')).toBeTruthy())

    fireEvent.press(screen.getByTestId('emergency-3114'))
    expect(Linking.openURL).toHaveBeenCalledWith('tel:3114')
  })

  it('les deux boutons d\'urgence appellent des numéros distincts', async () => {
    render(<FieldRenderer preview_kind="editable_steps" fields={MOCK_FIELDS} moduleId="crisis_plan" />)
    await waitFor(() => {
      expect(screen.getByTestId('emergency-15')).toBeTruthy()
      expect(screen.getByTestId('emergency-3114')).toBeTruthy()
    })

    fireEvent.press(screen.getByTestId('emergency-15'))
    fireEvent.press(screen.getByTestId('emergency-3114'))
    expect(Linking.openURL).toHaveBeenNthCalledWith(1, 'tel:15')
    expect(Linking.openURL).toHaveBeenNthCalledWith(2, 'tel:3114')
  })

  it('affiche un item existant et appelle savePlanItem à l\'édition', async () => {
    const existingItem = { id: 'existing-1', module_id: 'crisis_plan', section_id: 'step_1', text: 'Mon signe', sort_order: 0, created_at: '2025-01-01' }
    ;(database.getAllPlanItemsForModule as jest.Mock).mockResolvedValue([existingItem])

    render(<FieldRenderer preview_kind="editable_steps" fields={MOCK_FIELDS} moduleId="crisis_plan" />)
    await waitFor(() => expect(screen.getByTestId('step-header-1')).toBeTruthy())

    fireEvent.press(screen.getByTestId('step-header-1'))
    await waitFor(() => expect(screen.getByText('Mon signe')).toBeTruthy())

    fireEvent.press(screen.getByText('Mon signe'))
    const editInput = screen.getByTestId('step-1-edit-input-existing-1')
    fireEvent.changeText(editInput, 'Mon signe modifié')
    fireEvent.press(screen.getByTestId('step-1-validate-edit-existing-1'))

    await waitFor(() => {
      expect(database.savePlanItem).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'existing-1', text: 'Mon signe modifié' })
      )
    })
  })
})
