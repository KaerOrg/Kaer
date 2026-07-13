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
import { StyleSheet } from 'react-native'
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

// Variante avec statut « à compléter » : une fiche sans complete_key_* porte la puce.
const COMPLETION_CFG = makeField({
  id: 'beck.cfg', field_type: 'column_form_config', sort_order: 0,
  props: {
    engagement_event_type: 'SAVE_BECK_THOUGHT_RECORD',
    required_key_1: 'situation', required_key_2: 'automatic_thought',
    complete_key_1: 'rational_response',
    to_complete_label: 'modules.beck_columns.to_complete',
  },
})
const COMPLETION_FIELDS: ContentField[] = [COMPLETION_CFG, ...MOCK_FIELDS.slice(1)]

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

describe('FieldRenderer — column_form : puce « à compléter »', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(database.getAllFormEntries as jest.Mock).mockResolvedValue([])
  })

  it('une fiche sans réponse rationnelle porte la puce « à compléter »', async () => {
    ;(database.getAllFormEntries as jest.Mock).mockResolvedValue([MOCK_ENTRY, COMPLETE_ENTRY])
    renderLayout(COMPLETION_FIELDS)

    expect(await screen.findByTestId('to-complete-entry-1')).toBeTruthy()
    expect(screen.queryByTestId('to-complete-entry-2')).toBeNull()
  })

  it('la puce « à compléter » ouvre l’édition COMPLÈTE de la fiche', async () => {
    ;(database.getAllFormEntries as jest.Mock).mockResolvedValue([MOCK_ENTRY])
    renderLayout(COMPLETION_FIELDS)
    fireEvent.press(await screen.findByTestId('to-complete-entry-1'))

    // Formulaire complet : valeurs existantes préservées + slider visible.
    expect(screen.getByDisplayValue('au travail')).toBeTruthy()
    expect(screen.getByTestId('slider-thought_belief')).toBeTruthy()
  })
})

describe('FieldRenderer — column_form : curseurs sans pré-sélection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(database.getAllFormEntries as jest.Mock).mockResolvedValue([])
  })

  it('un curseur non touché ne sauvegarde AUCUNE valeur (pas de faux 50)', async () => {
    renderLayout()
    fireEvent.press(await screen.findByTestId('new-entry'))
    fireEvent.changeText(screen.getByTestId('field-situation'), 'au bureau')
    fireEvent.press(screen.getByTestId('save-entry'))

    await waitFor(() => expect(database.saveFormEntry).toHaveBeenCalled())
    const saved = (database.saveFormEntry as jest.Mock).mock.calls[0][0] as database.FormEntry
    expect(saved.values.situation).toBe('au bureau')
    expect(saved.values.thought_belief).toBeUndefined()
  })
})

describe('FieldRenderer — column_form : fiche dépliable en liste', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(database.getAllFormEntries as jest.Mock).mockResolvedValue([MOCK_ENTRY])
  })

  it('replié : textes tronqués, pas de ligne dédiée par curseur', async () => {
    renderLayout()
    await screen.findByTestId('record-entry-1')
    expect(screen.queryByTestId('record-slider-thought_belief')).toBeNull()
  })

  it('déplié au tap : chaque curseur renseigné a sa ligne (valeur brute), re-tap replie', async () => {
    renderLayout()
    fireEvent.press(await screen.findByTestId('record-entry-1'))

    expect(screen.getByTestId('record-slider-thought_belief')).toBeTruthy()
    expect(screen.getByText(/80/)).toBeTruthy()

    fireEvent.press(screen.getByTestId('record-entry-1'))
    expect(screen.queryByTestId('record-slider-thought_belief')).toBeNull()
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

// ─── Refonte 1B (#145) : wizard opt-in ─────────────────────────────────────────

const COL1_Q: ContentField = { ...COL1, props: { ...COL1.props, question_code: 'modules.beck_columns.entry_col_1_question' } }
const COL3_Q: ContentField = {
  ...COL3,
  props: { ...COL3.props, question_code: 'modules.beck_columns.entry_col_3_question', note_code: 'modules.beck_columns.entry_col_3_note' },
}
const WIZARD_CFG = makeField({
  id: 'beck.cfg', field_type: 'column_form_config', sort_order: 0,
  props: {
    entry_mode: 'wizard',
    required_key_1: 'situation', required_key_2: 'automatic_thought',
    save_label: 'modules.beck_columns.save',
  },
})
const WIZARD_FIELDS: ContentField[] = [WIZARD_CFG, COL1_Q, COL3_Q]

describe('FieldRenderer — column_form : wizard (entry_mode=wizard)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(database.getAllFormEntries as jest.Mock).mockResolvedValue([])
  })

  it('affiche la barre de progression (un segment par colonne) et UNE colonne à la fois', async () => {
    renderLayout(WIZARD_FIELDS)
    fireEvent.press(await screen.findByTestId('new-entry'))
    expect(screen.getByTestId('wizard-progress')).toBeTruthy()
    expect(screen.getByTestId('wizard-progress-0')).toBeTruthy()
    expect(screen.getByTestId('wizard-progress-1')).toBeTruthy()
    expect(screen.queryByTestId('wizard-progress-2')).toBeNull()
    // Étape 1 : situation seulement.
    expect(screen.getByTestId('field-situation')).toBeTruthy()
    expect(screen.queryByTestId('field-automatic_thought')).toBeNull()
    // Pas d'enregistrement tant qu'on n'est pas à la dernière étape.
    expect(screen.getByTestId('wizard-next')).toBeTruthy()
    expect(screen.queryByTestId('save-entry')).toBeNull()
  })

  it('« Continuer » avance à l\'étape suivante ; la dernière étape montre « Enregistrer »', async () => {
    renderLayout(WIZARD_FIELDS)
    fireEvent.press(await screen.findByTestId('new-entry'))
    fireEvent.press(screen.getByTestId('wizard-next'))
    expect(screen.getByTestId('field-automatic_thought')).toBeTruthy()
    expect(screen.queryByTestId('field-situation')).toBeNull()
    expect(screen.getByTestId('save-entry')).toBeTruthy()
    expect(screen.queryByTestId('wizard-next')).toBeNull()
  })

  it('enregistre depuis la dernière étape du wizard', async () => {
    renderLayout(WIZARD_FIELDS)
    fireEvent.press(await screen.findByTestId('new-entry'))
    fireEvent.changeText(screen.getByTestId('field-situation'), 'dans le métro')
    fireEvent.press(screen.getByTestId('wizard-next'))
    fireEvent.press(screen.getByTestId('save-entry'))
    await waitFor(() => {
      expect(database.saveFormEntry).toHaveBeenCalledWith(
        expect.objectContaining({ values: expect.objectContaining({ situation: 'dans le métro' }) }),
      )
    })
  })

  it('« retour » à la première étape revient à la liste', async () => {
    renderLayout(WIZARD_FIELDS)
    fireEvent.press(await screen.findByTestId('new-entry'))
    fireEvent.press(screen.getByTestId('wizard-back'))
    await waitFor(() => expect(screen.getByTestId('list-empty')).toBeTruthy())
  })

  it('sans entry_mode=wizard, la saisie reste en scroll (toutes les colonnes, pas de progression)', async () => {
    renderLayout()
    fireEvent.press(await screen.findByTestId('new-entry'))
    expect(screen.queryByTestId('wizard-progress')).toBeNull()
    expect(screen.getByTestId('column-beck.col_situation')).toBeTruthy()
    expect(screen.getByTestId('column-beck.col_thought')).toBeTruthy()
  })

  // Refonte 1B — parité spec « saisie » : le champ texte porte le liseré d'accent
  // de l'étape, et l'encart `note_code` est un bandeau teinté à ce même accent.
  it('teinte le champ texte et le bandeau d\'aide à la couleur d\'accent de l\'étape', async () => {
    renderLayout(WIZARD_FIELDS)
    fireEvent.press(await screen.findByTestId('new-entry'))
    // Étape 1 (situation, accent bleu) : pas de note.
    const input1 = StyleSheet.flatten(screen.getByTestId('field-situation').props.style)
    expect(input1.borderColor).toBe('#0EA5E9')
    expect(screen.queryByTestId('wizard-note')).toBeNull()
    // Étape 2 = colonne « pensée automatique » (accent rouge) : note visible + teintée.
    fireEvent.press(screen.getByTestId('wizard-next'))
    const input3 = StyleSheet.flatten(screen.getByTestId('field-automatic_thought').props.style)
    expect(input3.borderColor).toBe('#EF4444')
    const note = StyleSheet.flatten(screen.getByTestId('wizard-note').props.style)
    expect(note.backgroundColor).toBe('#EF4444' + '1A')
    // La note s'intercale entre le champ texte et le curseur de croyance (spec 1B).
    const col = screen.getByTestId('column-beck.col_thought')
    const ids = col
      .findAll((n: { props: { testID?: string } }) => typeof n.props.testID === 'string')
      .map((n: { props: { testID?: string } }) => n.props.testID)
    expect(ids.indexOf('field-automatic_thought')).toBeLessThan(ids.indexOf('wizard-note'))
    expect(ids.indexOf('wizard-note')).toBeLessThan(ids.indexOf('slider-thought_belief'))
  })
})

// ─── Refonte 1B (#145) : carte récit (list_card_variant=narrative) ──────────────

const NARR_EMOTION = makeField({
  id: 'beck.col2.h', section_id: 'beck.col_emotion', sort_order: 20,
  text_code: 'modules.beck_columns.entry_col_2_title', props: { color: '#8B5CF6' },
  children: [
    makeField({
      id: 'beck.col2.slider', section_id: 'beck.col_emotion', parent_field_id: 'beck.col2.h',
      field_type: 'column_slider_field', sort_order: 22,
      text_code: 'modules.beck_columns.entry_col_2_intensity',
      props: { key: 'emotion_intensity', min: '0', max: '100', step: '1', unit: '%' },
    }),
  ],
})
const NARR_OUTCOME = makeField({
  id: 'beck.col5.h', section_id: 'beck.col_outcome', sort_order: 50,
  text_code: 'modules.beck_columns.entry_col_5_title', props: { color: '#EC4899' },
  children: [
    makeField({
      id: 'beck.col5.intens', section_id: 'beck.col_outcome', parent_field_id: 'beck.col5.h',
      field_type: 'column_slider_field', sort_order: 51,
      text_code: 'modules.beck_columns.entry_col_5_intensity',
      props: { key: 'outcome_intensity', min: '0', max: '100', step: '1', unit: '%' },
    }),
  ],
})
const NARRATIVE_CFG = makeField({
  id: 'beck.cfg', field_type: 'column_form_config', sort_order: 0,
  props: {
    required_key_1: 'situation',
    list_card_variant: 'narrative',
    narrative_title_key: 'situation',
    narrative_strike_key: 'automatic_thought',
    narrative_strike_label: 'modules.beck_columns.narrative_strike',
    narrative_reframe_key: 'rational_response',
    narrative_reframe_label: 'modules.beck_columns.narrative_reframe',
    narrative_expand_label: 'modules.beck_columns.see_reasoning',
    arc_before_key: 'emotion_intensity',
    arc_after_key: 'outcome_intensity',
    arc_caption_key: 'emotion',
    arc_unit: '%',
    arc_before_label: 'modules.beck_columns.arc_before',
    arc_after_label: 'modules.beck_columns.arc_after',
    arc_todo_label: 'modules.beck_columns.arc_todo',
  },
})
const NARRATIVE_FIELDS: ContentField[] = [NARRATIVE_CFG, COL1, NARR_EMOTION, COL3, NARR_OUTCOME]

describe('FieldRenderer — column_form : carte récit (list_card_variant=narrative)', () => {
  beforeEach(() => { jest.clearAllMocks() })

  it('rend la carte récit (lien de dépliage) quand la variante narrative est active', async () => {
    ;(database.getAllFormEntries as jest.Mock).mockResolvedValue([
      { id: 'e1', module_id: 'beck_columns', values: { situation: 'dans le métro' }, created_at: '2026-07-05T10:00:00Z' },
    ])
    renderLayout(NARRATIVE_FIELDS)
    expect(await screen.findByTestId('record-e1')).toBeTruthy()
    // Le lien « voir le raisonnement complet » est propre à la carte récit.
    expect(screen.getByTestId('expand-e1')).toBeTruthy()
    expect(screen.getByText('dans le métro')).toBeTruthy()
  })

  it('affiche l\'arc avant → après quand les deux mesures sont renseignées', async () => {
    ;(database.getAllFormEntries as jest.Mock).mockResolvedValue([
      { id: 'e1', module_id: 'beck_columns', values: { situation: 'x', emotion_intensity: 90, outcome_intensity: 40 }, created_at: '2026-07-05T10:00:00Z' },
    ])
    renderLayout(NARRATIVE_FIELDS)
    expect(await screen.findByTestId('arc-e1')).toBeTruthy()
    expect(screen.getByText('90%')).toBeTruthy()
    expect(screen.getByText('40%')).toBeTruthy()
  })

  it('affiche l\'encart « à finir » quand la ré-évaluation manque', async () => {
    ;(database.getAllFormEntries as jest.Mock).mockResolvedValue([
      { id: 'e1', module_id: 'beck_columns', values: { situation: 'x', emotion_intensity: 100 }, created_at: '2026-07-05T10:00:00Z' },
    ])
    renderLayout(NARRATIVE_FIELDS)
    expect(await screen.findByTestId('arc-todo-e1')).toBeTruthy()
    expect(screen.queryByTestId('arc-e1')).toBeNull()
  })
})
