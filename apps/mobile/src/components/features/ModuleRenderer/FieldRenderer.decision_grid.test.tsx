jest.mock('../../../hooks/useTeen', () => ({
  useTeen: () => ({ isTeenMode: false, tt: () => '', tg: () => '', teenColor: () => undefined }),
}))

jest.mock('../../../lib/database', () => ({
  // Layouts dont les fonctions sont importées par FieldRenderer.tsx au load
  getAllPlanItemsForModule: jest.fn().mockResolvedValue([]),
  savePlanItem: jest.fn().mockResolvedValue(undefined),
  deletePlanItem: jest.fn().mockResolvedValue(undefined),
  getAllCognitiveSaturationSessions: jest.fn().mockResolvedValue([]),
  saveCognitiveSaturationSession: jest.fn().mockResolvedValue(undefined),
  deleteCognitiveSaturationSession: jest.fn().mockResolvedValue(undefined),
  getDailyEntry: jest.fn().mockResolvedValue(null),
  getAllDailyEntries: jest.fn().mockResolvedValue([]),
  saveDailyEntry: jest.fn().mockResolvedValue(undefined),
  deleteDailyEntry: jest.fn().mockResolvedValue(undefined),
  getAllFormEntries: jest.fn().mockResolvedValue([]),
  saveFormEntry: jest.fn().mockResolvedValue(undefined),
  deleteFormEntry: jest.fn().mockResolvedValue(undefined),
  getAllTreeSelections: jest.fn().mockResolvedValue([]),
  saveTreeSelection: jest.fn().mockResolvedValue(undefined),
  deleteTreeSelection: jest.fn().mockResolvedValue(undefined),
  getAllSleepEntries: jest.fn().mockResolvedValue([]),
  getSleepEntry: jest.fn().mockResolvedValue(null),
  getSleepEntriesForMonth: jest.fn().mockResolvedValue([]),
  saveSleepEntry: jest.fn().mockResolvedValue(undefined),
  deleteSleepEntry: jest.fn().mockResolvedValue(undefined),
  computeSleepDuration: jest.fn(),
  computeSleepEfficiency: jest.fn(),
  // Decision grid — under test
  getModuleSetting: jest.fn().mockResolvedValue(null),
  setModuleSetting: jest.fn().mockResolvedValue(undefined),
  generateId: jest.fn().mockReturnValue('arg-test-id'),
}))

jest.mock('../../../lib/dateUtils', () => ({
  formatDateTime: (str: string) => str,
  formatDateFull: (str: string) => `full:${str}`,
  formatDateNumeric: (str: string) => `num:${str}`,
  formatDateShort: (str: string) => `short:${str}`,
  formatDateShortYear: (str: string) => `sy:${str}`,
}))

jest.mock('../../../store/authStore', () => ({
  useAuthStore: (selector: (s: { patient: { id: string } }) => unknown) =>
    selector({ patient: { id: 'patient-test-id' } }),
}))

jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons')
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }))

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import { FieldRenderer } from './FieldRenderer'
import * as database from '../../../lib/database'
import type { ContentField } from '../../../services/moduleService'

jest.setTimeout(15000)

function makeField(overrides: Partial<ContentField> & { children?: ContentField[] }): ContentField {
  return {
    id: overrides.id ?? 'f',
    module_id: 'decisional_balance',
    section_id: overrides.section_id ?? null,
    parent_field_id: overrides.parent_field_id ?? null,
    field_type: overrides.field_type ?? 'decision_grid_config',
    text_code: overrides.text_code ?? null,
    sort_order: overrides.sort_order ?? 0,
    props: overrides.props ?? {},
    children: overrides.children ?? [],
  }
}

const MOCK_FIELDS: ContentField[] = [
  makeField({
    id: 'db.cfg', field_type: 'decision_grid_config', sort_order: 0,
    // Le composant lit tous les libellés depuis configField.props via `lbl(key)` ;
    // ils ne sont pas des champs séparés (cf. DecisionGridLayout.tsx).
    props: {
      engagement_event_type: 'UPDATE_DECISIONAL_BALANCE',
      target_behavior_key: 'target_behavior',
      weight_min: '1',
      weight_max: '5',
      weight_default: '3',
      gauge_fill_color: '#EC4899',
      target_label: 'modules.decisional_balance.behavior_label',
      target_placeholder: 'modules.decisional_balance.behavior_placeholder',
      save_label: 'modules.decisional_balance.save',
      saved_message: 'modules.decisional_balance.saved_message',
      gauge_title: 'modules.decisional_balance.gauge_title',
      gauge_change_label: 'modules.decisional_balance.gauge_label_change',
      gauge_status_label: 'modules.decisional_balance.gauge_label_status',
      add_label: 'modules.decisional_balance.add_trigger',
      arg_placeholder: 'modules.decisional_balance.arg_placeholder',
      weight_label: 'modules.decisional_balance.weight_label',
    },
  }),
  // Quadrants
  makeField({
    id: 'db.q1.h', field_type: 'column_header', section_id: 'pros_change', sort_order: 10,
    text_code: 'modules.decisional_balance.quadrant_pros_change_title',
    props: { color: '#059669', bg_color: '#ECFDF5', icon: 'thumb-up-outline', gauge_role: 'change', subtitle_code: 'modules.decisional_balance.quadrant_pros_change_subtitle' },
  }),
  makeField({
    id: 'db.q2.h', field_type: 'column_header', section_id: 'cons_change', sort_order: 20,
    text_code: 'modules.decisional_balance.quadrant_cons_change_title',
    props: { color: '#EA580C', bg_color: '#FFF7ED', icon: 'thumb-down-outline', subtitle_code: 'modules.decisional_balance.quadrant_cons_change_subtitle' },
  }),
  makeField({
    id: 'db.q3.h', field_type: 'column_header', section_id: 'pros_status_quo', sort_order: 30,
    text_code: 'modules.decisional_balance.quadrant_pros_status_title',
    props: { color: '#2563EB', bg_color: '#EFF6FF', icon: 'shield-check-outline', gauge_role: 'status_quo', subtitle_code: 'modules.decisional_balance.quadrant_pros_status_subtitle' },
  }),
  makeField({
    id: 'db.q4.h', field_type: 'column_header', section_id: 'cons_status_quo', sort_order: 40,
    text_code: 'modules.decisional_balance.quadrant_cons_status_title',
    props: { color: '#9333EA', bg_color: '#FDF4FF', icon: 'alert-outline', subtitle_code: 'modules.decisional_balance.quadrant_cons_status_subtitle' },
  }),
]

function renderLayout() {
  return render(
    <FieldRenderer
      preview_kind="decision_grid"
      fields={MOCK_FIELDS}
      moduleId="decisional_balance"
    />
  )
}

describe('FieldRenderer — decision_grid (DecisionGridLayout)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(database.getAllPlanItemsForModule as jest.Mock).mockResolvedValue([])
    ;(database.getModuleSetting as jest.Mock).mockResolvedValue(null)
    ;(database.savePlanItem as jest.Mock).mockResolvedValue(undefined)
    ;(database.setModuleSetting as jest.Mock).mockResolvedValue(undefined)
  })

  it('charge les items + le target_behavior au montage', async () => {
    renderLayout()
    await waitFor(() => {
      expect(database.getAllPlanItemsForModule).toHaveBeenCalledWith('decisional_balance')
      expect(database.getModuleSetting).toHaveBeenCalledWith('decisional_balance', 'target_behavior')
    })
  })

  it('rend les 4 quadrants', async () => {
    renderLayout()
    await waitFor(() => {
      expect(screen.getByTestId('quadrant-pros_change')).toBeTruthy()
      expect(screen.getByTestId('quadrant-cons_change')).toBeTruthy()
      expect(screen.getByTestId('quadrant-pros_status_quo')).toBeTruthy()
      expect(screen.getByTestId('quadrant-cons_status_quo')).toBeTruthy()
    })
  })

  it('rend la jauge de motivation', async () => {
    renderLayout()
    await waitFor(() => {
      expect(screen.getByTestId('motivation-gauge')).toBeTruthy()
    })
  })

  it('pré-remplit le champ target_behavior depuis module_settings', async () => {
    ;(database.getModuleSetting as jest.Mock).mockResolvedValueOnce('Arrêter le tabac')
    renderLayout()
    await waitFor(() => {
      const input = screen.getByTestId('target-behavior-input')
      expect(input.props.value).toBe('Arrêter le tabac')
    })
  })

  it("ajoute un argument avec poids dans pros_change → savePlanItem(weight = défaut 3)", async () => {
    renderLayout()
    await waitFor(() => expect(screen.getByTestId('quad-pros_change-add')).toBeTruthy())
    fireEvent.press(screen.getByTestId('quad-pros_change-add'))

    fireEvent.changeText(screen.getByTestId('quad-pros_change-new-input'), 'Plus d\'énergie')
    fireEvent.press(screen.getByTestId('quad-pros_change-validate-new'))

    await waitFor(() => {
      expect(database.savePlanItem).toHaveBeenCalledWith(
        expect.objectContaining({
          module_id: 'decisional_balance',
          section_id: 'pros_change',
          text: 'Plus d\'énergie',
          weight: 3,
        })
      )
    })
  })

  it("ne sauve pas si le texte est vide", async () => {
    renderLayout()
    await waitFor(() => expect(screen.getByTestId('quad-pros_change-add')).toBeTruthy())
    fireEvent.press(screen.getByTestId('quad-pros_change-add'))
    fireEvent.press(screen.getByTestId('quad-pros_change-validate-new'))

    expect(database.savePlanItem).not.toHaveBeenCalled()
  })

  it("ajuste le poids inline (tap sur étoile) → savePlanItem appelé avec le nouveau weight", async () => {
    const existingItem = {
      id: 'arg-1', module_id: 'decisional_balance', section_id: 'pros_change',
      text: 'Famille', sort_order: 0, weight: 3, created_at: '2025-01-01',
    }
    ;(database.getAllPlanItemsForModule as jest.Mock).mockResolvedValueOnce([existingItem])

    renderLayout()
    await waitFor(() => expect(screen.getByText('Famille')).toBeTruthy())

    // Tape sur la 5e étoile pour mettre weight = 5
    fireEvent.press(screen.getByTestId('quad-pros_change-weight-arg-1-5'))

    await waitFor(() => {
      expect(database.savePlanItem).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'arg-1', text: 'Famille', weight: 5 })
      )
    })
  })

  it("le bouton Sauvegarder appelle setModuleSetting", async () => {
    renderLayout()
    await waitFor(() => expect(screen.getByTestId('save-decision-grid')).toBeTruthy())

    fireEvent.changeText(screen.getByTestId('target-behavior-input'), 'Mon objectif')
    fireEvent.press(screen.getByTestId('save-decision-grid'))

    await waitFor(() => {
      expect(database.setModuleSetting).toHaveBeenCalledWith(
        'decisional_balance', 'target_behavior', 'Mon objectif'
      )
    })
  })

  it("la suppression demande confirmation puis appelle deletePlanItem", async () => {
    const existingItem = {
      id: 'arg-2', module_id: 'decisional_balance', section_id: 'cons_change',
      text: 'Stress', sort_order: 0, weight: 4, created_at: '2025-01-01',
    }
    ;(database.getAllPlanItemsForModule as jest.Mock).mockResolvedValueOnce([existingItem])

    renderLayout()
    await waitFor(() => expect(screen.getByText('Stress')).toBeTruthy())
    fireEvent.press(screen.getByTestId('quad-cons_change-delete-arg-2'))

    await waitFor(() => {
      expect(database.deletePlanItem).toHaveBeenCalledWith('arg-2')
    })
  })

  it("la jauge agrège uniquement les quadrants avec gauge_role", async () => {
    const items = [
      // pros_change → contribue à changeScore (gauge_role = change)
      { id: 'a1', module_id: 'decisional_balance', section_id: 'pros_change',     text: 'A', sort_order: 0, weight: 4, created_at: '2025-01-01' },
      { id: 'a2', module_id: 'decisional_balance', section_id: 'pros_change',     text: 'B', sort_order: 1, weight: 2, created_at: '2025-01-01' },
      // pros_status_quo → contribue à statusQuoScore (gauge_role = status_quo)
      { id: 'a3', module_id: 'decisional_balance', section_id: 'pros_status_quo', text: 'C', sort_order: 0, weight: 3, created_at: '2025-01-01' },
      // cons_change / cons_status_quo → ignorés (pas de gauge_role)
      { id: 'a4', module_id: 'decisional_balance', section_id: 'cons_change',     text: 'D', sort_order: 0, weight: 5, created_at: '2025-01-01' },
      { id: 'a5', module_id: 'decisional_balance', section_id: 'cons_status_quo', text: 'E', sort_order: 0, weight: 5, created_at: '2025-01-01' },
    ]
    ;(database.getAllPlanItemsForModule as jest.Mock).mockResolvedValueOnce(items)

    renderLayout()
    await waitFor(() => expect(screen.getByTestId('motivation-gauge')).toBeTruthy())

    // Vérifie que la jauge montre changeScore=6 et statusQuoScore=3 (les cons sont ignorés).
    expect(screen.getByText(/6/).props.children).toContain(6)
    expect(screen.getByText(/3/).props.children).toContain(3)
  })
})
