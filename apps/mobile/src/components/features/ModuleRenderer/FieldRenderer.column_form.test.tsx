jest.mock('../../../hooks/useTeen', () => ({
  useTeen: () => ({ isTeenMode: false, tt: () => '', tg: () => '', teenColor: () => undefined }),
}))

jest.mock('../../../lib/database', () => ({
  // Plan items / cognitive saturation / daily — unused here but required at module load
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
  // Form entries — under test
  getAllFormEntries: jest.fn().mockResolvedValue([]),
  saveFormEntry: jest.fn().mockResolvedValue(undefined),
  deleteFormEntry: jest.fn().mockResolvedValue(undefined),
  generateId: jest.fn().mockReturnValue('test-form-id-1'),
}))

jest.mock('../../../lib/dateUtils', () => ({
  formatDateTime: (str: string) => str,
  formatDateFull: (str: string) => `full:${str}`,
  formatDateNumeric: (str: string) => `num:${str}`,
}))

jest.mock('../../../store/authStore', () => ({
  useAuthStore: (selector: (s: { patient: { id: string } }) => unknown) =>
    selector({ patient: { id: 'patient-test-id' } }),
}))

jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons')
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }))

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native'
import { FieldRenderer } from './FieldRenderer'
import * as database from '../../../lib/database'
import { useToast } from '../../../contexts/ToastContext'
import type { ContentField } from '@services/moduleService'

jest.setTimeout(15000)

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeField(overrides: Partial<ContentField> & { children?: ContentField[] }): ContentField {
  return {
    id: overrides.id ?? 'f',
    module_id: 'beck_columns',
    section_id: overrides.section_id ?? null,
    parent_field_id: overrides.parent_field_id ?? null,
    field_type: overrides.field_type ?? 'column_header',
    text_code: overrides.text_code ?? null,
    sort_order: overrides.sort_order ?? 0,
    props: overrides.props ?? {},
    children: overrides.children ?? [],
  }
}

// On reflète la structure que `fetchModuleFields` renverrait : top-level + children.
const COL1 = makeField({
  id: 'beck.col1.h', section_id: 'beck.col_situation', sort_order: 10,
  text_code: 'modules.beck_columns.entry_col_1_title',
  props: { color: '#0EA5E9', step_number: '1', hint_code: 'modules.beck_columns.entry_col_1_hint' },
  children: [
    makeField({
      id: 'beck.col1.text', section_id: 'beck.col_situation', parent_field_id: 'beck.col1.h',
      field_type: 'column_text_field', sort_order: 11,
      text_code: 'modules.beck_columns.entry_col_1_placeholder',
      props: { key: 'situation', multiline: '1', min_height: '72' },
    }),
  ],
})

const COL3 = makeField({
  id: 'beck.col3.h', section_id: 'beck.col_thought', sort_order: 30,
  text_code: 'modules.beck_columns.entry_col_3_title',
  props: { color: '#EF4444', step_number: '3', hint_code: 'modules.beck_columns.entry_col_3_hint' },
  children: [
    makeField({
      id: 'beck.col3.text', section_id: 'beck.col_thought', parent_field_id: 'beck.col3.h',
      field_type: 'column_text_field', sort_order: 31,
      text_code: 'modules.beck_columns.entry_col_3_placeholder',
      props: { key: 'automatic_thought', multiline: '1' },
    }),
    makeField({
      id: 'beck.col3.slider', section_id: 'beck.col_thought', parent_field_id: 'beck.col3.h',
      field_type: 'column_slider_field', sort_order: 32,
      text_code: 'modules.beck_columns.entry_col_3_belief',
      props: { key: 'thought_belief', min: '0', max: '100', step: '10', color: '#EF4444' },
    }),
  ],
})

const MOCK_FIELDS: ContentField[] = [
  makeField({
    id: 'beck.cfg', field_type: 'column_form_config', sort_order: 0,
    props: { engagement_event_type: 'SAVE_BECK_THOUGHT_RECORD', required_key_1: 'situation', required_key_2: 'automatic_thought' },
  }),
  makeField({ id: 'beck.new_btn',     field_type: 'column_form_new_btn_label',    sort_order: 1, text_code: 'modules.beck_columns.new_thought' }),
  makeField({ id: 'beck.save_label',  field_type: 'column_form_save_label',       sort_order: 2, text_code: 'modules.beck_columns.save' }),
  makeField({ id: 'beck.empty_title', field_type: 'column_form_empty_title',      sort_order: 3, text_code: 'modules.beck_columns.empty_title' }),
  makeField({ id: 'beck.empty_text',  field_type: 'column_form_empty_text',       sort_order: 4, text_code: 'modules.beck_columns.intro' }),
  makeField({ id: 'beck.del_title',   field_type: 'column_form_delete_title',     sort_order: 5, text_code: 'modules.beck_columns.delete_record_title' }),
  makeField({ id: 'beck.val_title',   field_type: 'column_form_validation_title', sort_order: 6, text_code: 'modules.beck_columns.empty_alert_title' }),
  makeField({ id: 'beck.val_msg',     field_type: 'column_form_validation_msg',   sort_order: 7, text_code: 'modules.beck_columns.empty_alert_msg' }),
  COL1, COL3,
]

const MOCK_ENTRY: database.FormEntry = {
  id: 'entry-1',
  module_id: 'beck_columns',
  values: { situation: 'au travail', automatic_thought: 'je suis nul', thought_belief: 80 },
  created_at: '2026-05-05T10:00:00Z',
}

// Variante avec capture en deux temps : formulaire réduit + statut « à compléter ».
const QUICK_CFG = makeField({
  id: 'beck.cfg', field_type: 'column_form_config', sort_order: 0,
  props: {
    engagement_event_type: 'SAVE_BECK_THOUGHT_RECORD',
    required_key_1: 'situation', required_key_2: 'automatic_thought',
    quick_btn_label: 'modules.beck_columns.quick_capture',
    quick_key_1: 'situation', quick_key_2: 'automatic_thought',
    complete_key_1: 'rational_response',
    to_complete_label: 'modules.beck_columns.to_complete',
  },
})
const QUICK_FIELDS: ContentField[] = [QUICK_CFG, ...MOCK_FIELDS.slice(1)]

const COMPLETE_ENTRY: database.FormEntry = {
  ...MOCK_ENTRY,
  id: 'entry-2',
  values: { ...MOCK_ENTRY.values, rational_response: 'une lecture plus nuancée existe' },
}

// Variante avec chips de suggestions sur le champ situation.
const COL1_WITH_SUGGESTIONS = makeField({
  id: 'beck.col1.h', section_id: 'beck.col_situation', sort_order: 10,
  text_code: 'modules.beck_columns.entry_col_1_title',
  props: { color: '#0EA5E9', step_number: '1' },
  children: [
    makeField({
      id: 'beck.col1.text', section_id: 'beck.col_situation', parent_field_id: 'beck.col1.h',
      field_type: 'column_text_field', sort_order: 11,
      props: {
        key: 'situation', multiline: '1',
        suggestion_1: 'modules.beck_columns.sugg_anxiety',
        suggestion_2: 'modules.beck_columns.sugg_anger',
      },
    }),
  ],
})
const SUGG_FIELDS: ContentField[] = [MOCK_FIELDS[0], COL1_WITH_SUGGESTIONS, COL3]

// Colonne optionnelle (groupe « evidence ») — visible seulement si le praticien
// a activé le groupe dans patient_modules.config.enabled_groups.
const EVIDENCE_COL = makeField({
  id: 'beck.col_evf.h', section_id: 'beck.col_evidence_for', sort_order: 37,
  text_code: 'modules.beck_columns.entry_col_evidence_for_title',
  props: { color: '#0891B2', optional_group: 'evidence' },
  children: [
    makeField({
      id: 'beck.col_evf.text', section_id: 'beck.col_evidence_for', parent_field_id: 'beck.col_evf.h',
      field_type: 'column_text_field', sort_order: 37,
      props: { key: 'evidence_for', multiline: '1' },
    }),
  ],
})
const FIELDS_WITH_OPTIONAL: ContentField[] = [...MOCK_FIELDS, EVIDENCE_COL]

function renderLayout(
  fields: ContentField[] = MOCK_FIELDS,
  patientConfig: Record<string, unknown> | null = null,
) {
  return render(
    <FieldRenderer
      preview_kind="column_form"
      fields={fields}
      moduleId="beck_columns"
      patientConfig={patientConfig}
    />
  )
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('FieldRenderer — column_form (ColumnFormLayout)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(database.getAllFormEntries as jest.Mock).mockResolvedValue([])
  })

  it('charge les entrées au montage', async () => {
    renderLayout()
    await waitFor(() => {
      expect(database.getAllFormEntries).toHaveBeenCalledWith('beck_columns')
    })
  })

  it('affiche l\'état vide quand il n\'y a pas d\'entrée', async () => {
    renderLayout()
    expect(await screen.findByTestId('list-empty')).toBeTruthy()
  })

  it('affiche les enregistrements existants en mode liste', async () => {
    ;(database.getAllFormEntries as jest.Mock).mockResolvedValue([MOCK_ENTRY])
    renderLayout()
    expect(await screen.findByTestId('record-entry-1')).toBeTruthy()
    expect(screen.getByText(/au travail/)).toBeTruthy()
  })

  it('passe en mode entry au tap sur Nouveau', async () => {
    renderLayout()
    fireEvent.press(await screen.findByTestId('new-entry'))
    expect(await screen.findByTestId('column-beck.col_situation')).toBeTruthy()
    expect(screen.getByTestId('column-beck.col_thought')).toBeTruthy()
  })

  it('rend les champs texte et sliders enfants', async () => {
    renderLayout()
    fireEvent.press(await screen.findByTestId('new-entry'))
    expect(screen.getByTestId('field-situation')).toBeTruthy()
    expect(screen.getByTestId('field-automatic_thought')).toBeTruthy()
    expect(screen.getByTestId('slider-thought_belief')).toBeTruthy()
  })

  it('alerte et n\'enregistre pas si aucun champ requis n\'est rempli', async () => {
    renderLayout()
    fireEvent.press(await screen.findByTestId('new-entry'))
    fireEvent.press(screen.getByTestId('save-entry'))

    await waitFor(() => expect(useToast().showToast).toHaveBeenCalled())
    expect(database.saveFormEntry).not.toHaveBeenCalled()
  })

  it('enregistre une nouvelle entrée', async () => {
    renderLayout()
    fireEvent.press(await screen.findByTestId('new-entry'))
    fireEvent.changeText(screen.getByTestId('field-situation'), 'au bureau, lundi matin')
    fireEvent.press(screen.getByTestId('save-entry'))

    await waitFor(() => {
      expect(database.saveFormEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          module_id: 'beck_columns',
          values: expect.objectContaining({ situation: 'au bureau, lundi matin' }),
        })
      )
    })
  })

  it('édite une entrée existante', async () => {
    ;(database.getAllFormEntries as jest.Mock).mockResolvedValue([MOCK_ENTRY])
    renderLayout()
    fireEvent.press(await screen.findByTestId('edit-entry-1'))

    expect(screen.getByDisplayValue('au travail')).toBeTruthy()
    fireEvent.press(screen.getByTestId('save-entry'))

    await waitFor(() => {
      expect(database.saveFormEntry).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'entry-1' })
      )
    })
  })

  it('annule la saisie et revient à la liste', async () => {
    renderLayout()
    fireEvent.press(await screen.findByTestId('new-entry'))
    fireEvent.press(screen.getByTestId('cancel-entry'))
    await waitFor(() => expect(screen.getByTestId('list-empty')).toBeTruthy())
  })

  it('supprime une entrée après confirmation', async () => {
    ;(database.getAllFormEntries as jest.Mock).mockResolvedValue([MOCK_ENTRY])
    renderLayout()
    const deleteBtn = await screen.findByTestId('delete-entry-1')
    await act(async () => { fireEvent.press(deleteBtn) })
    await waitFor(() => {
      expect(database.deleteFormEntry).toHaveBeenCalledWith('entry-1')
    })
    await waitFor(() => expect(screen.queryByTestId('record-entry-1')).toBeNull())
  })
})

describe('FieldRenderer — column_form : capture en deux temps', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(database.getAllFormEntries as jest.Mock).mockResolvedValue([])
  })

  it('sans config quick_key_*, aucun bouton de capture rapide', async () => {
    renderLayout()
    await screen.findByTestId('new-entry')
    expect(screen.queryByTestId('quick-entry')).toBeNull()
  })

  it('la capture rapide ne montre que les champs quick (pas de slider)', async () => {
    renderLayout(QUICK_FIELDS)
    fireEvent.press(await screen.findByTestId('quick-entry'))

    expect(await screen.findByTestId('field-situation')).toBeTruthy()
    expect(screen.getByTestId('field-automatic_thought')).toBeTruthy()
    expect(screen.queryByTestId('slider-thought_belief')).toBeNull()
  })

  it('une fiche rapide ne sauvegarde AUCUNE valeur par défaut pour les champs non montrés', async () => {
    renderLayout(QUICK_FIELDS)
    fireEvent.press(await screen.findByTestId('quick-entry'))
    fireEvent.changeText(screen.getByTestId('field-automatic_thought'), 'je vais tout rater')
    fireEvent.press(screen.getByTestId('save-entry'))

    await waitFor(() => expect(database.saveFormEntry).toHaveBeenCalled())
    const saved = (database.saveFormEntry as jest.Mock).mock.calls[0][0] as database.FormEntry
    expect(saved.values.automatic_thought).toBe('je vais tout rater')
    expect(saved.values.thought_belief).toBeUndefined()
  })

  it('une fiche sans réponse rationnelle porte la puce « à compléter »', async () => {
    ;(database.getAllFormEntries as jest.Mock).mockResolvedValue([MOCK_ENTRY, COMPLETE_ENTRY])
    renderLayout(QUICK_FIELDS)

    expect(await screen.findByTestId('to-complete-entry-1')).toBeTruthy()
    expect(screen.queryByTestId('to-complete-entry-2')).toBeNull()
  })

  it('la puce « à compléter » ouvre l’édition COMPLÈTE de la fiche', async () => {
    ;(database.getAllFormEntries as jest.Mock).mockResolvedValue([MOCK_ENTRY])
    renderLayout(QUICK_FIELDS)
    fireEvent.press(await screen.findByTestId('to-complete-entry-1'))

    // Formulaire complet : valeurs existantes préservées + slider visible.
    expect(screen.getByDisplayValue('au travail')).toBeTruthy()
    expect(screen.getByTestId('slider-thought_belief')).toBeTruthy()
  })
})

describe('FieldRenderer — column_form : colonnes optionnelles (optional_group)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(database.getAllFormEntries as jest.Mock).mockResolvedValue([])
  })

  it('une colonne optional_group est masquée sans activation praticien', async () => {
    renderLayout(FIELDS_WITH_OPTIONAL)
    fireEvent.press(await screen.findByTestId('new-entry'))

    expect(screen.getByTestId('column-beck.col_situation')).toBeTruthy()
    expect(screen.queryByTestId('column-beck.col_evidence_for')).toBeNull()
    expect(screen.queryByTestId('field-evidence_for')).toBeNull()
  })

  it('la colonne apparaît quand le groupe est activé dans la config patient', async () => {
    renderLayout(FIELDS_WITH_OPTIONAL, { enabled_groups: ['evidence'] })
    fireEvent.press(await screen.findByTestId('new-entry'))

    expect(screen.getByTestId('column-beck.col_evidence_for')).toBeTruthy()
    expect(screen.getByTestId('field-evidence_for')).toBeTruthy()
  })

  it('une colonne SANS optional_group reste visible quelle que soit la config', async () => {
    renderLayout(FIELDS_WITH_OPTIONAL, { enabled_groups: [] })
    fireEvent.press(await screen.findByTestId('new-entry'))

    expect(screen.getByTestId('column-beck.col_situation')).toBeTruthy()
    expect(screen.getByTestId('column-beck.col_thought')).toBeTruthy()
  })
})

describe('FieldRenderer — column_form : chips de suggestions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(database.getAllFormEntries as jest.Mock).mockResolvedValue([])
  })

  it('sans props suggestion_*, aucune rangée de chips', async () => {
    renderLayout()
    fireEvent.press(await screen.findByTestId('new-entry'))
    expect(screen.queryByTestId('suggestions-situation')).toBeNull()
  })

  it('une chip ajoute son mot au champ, une seconde pression le retire', async () => {
    renderLayout(SUGG_FIELDS)
    fireEvent.press(await screen.findByTestId('new-entry'))
    const chip = screen.getByTestId('suggestion-situation-modules.beck_columns.sugg_anxiety')

    fireEvent.press(chip)
    const added = String(screen.getByTestId('field-situation').props.value)
    expect(added.length).toBeGreaterThan(0)

    fireEvent.press(chip)
    expect(screen.getByTestId('field-situation').props.value).toBe('')
  })

  it('le texte libre du patient est préservé quand une chip est ajoutée puis retirée', async () => {
    renderLayout(SUGG_FIELDS)
    fireEvent.press(await screen.findByTestId('new-entry'))
    const input = screen.getByTestId('field-situation')
    fireEvent.changeText(input, 'un peu perdu')

    const chip = screen.getByTestId('suggestion-situation-modules.beck_columns.sugg_anger')
    fireEvent.press(chip)
    const withChip = String(screen.getByTestId('field-situation').props.value)
    expect(withChip.startsWith('un peu perdu, ')).toBe(true)

    fireEvent.press(chip)
    expect(screen.getByTestId('field-situation').props.value).toBe('un peu perdu')
  })
})
