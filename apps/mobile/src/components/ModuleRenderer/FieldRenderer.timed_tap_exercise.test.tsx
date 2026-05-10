jest.mock('../../hooks/useTeen', () => ({
  useTeen: () => ({ isTeenMode: false, tt: () => '', tg: () => '', teenColor: () => undefined }),
}))

jest.mock('../../services/engagementService', () => ({ logEvent: jest.fn() }))
jest.mock('../../store/authStore', () => ({ useAuthStore: () => null }))

jest.mock('../../lib/database', () => ({
  getAllPlanItemsForModule: jest.fn().mockResolvedValue([]),
  savePlanItem: jest.fn().mockResolvedValue(undefined),
  deletePlanItem: jest.fn().mockResolvedValue(undefined),
  generateId: jest.fn().mockReturnValue('test-uuid-1234'),
  getAllCognitiveSaturationSessions: jest.fn().mockResolvedValue([]),
  saveCognitiveSaturationSession: jest.fn().mockResolvedValue(undefined),
  deleteCognitiveSaturationSession: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('../../lib/dateUtils', () => ({
  formatDateTime: (str: string) => str,
}))

jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons')
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }))

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native'
import { FieldRenderer } from './FieldRenderer'
import * as database from '../../lib/database'
import type { ContentField } from '../../services/moduleService'

jest.setTimeout(15000)

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeField(overrides: Partial<ContentField>): ContentField {
  return {
    id: overrides.id ?? 'field-id',
    module_id: 'cognitive_saturation',
    section_id: null,
    parent_field_id: null,
    field_type: overrides.field_type ?? 'timed_tap_config',
    text_code: overrides.text_code ?? null,
    sort_order: overrides.sort_order ?? 0,
    props: overrides.props ?? {},
    children: [],
  }
}

const MOCK_FIELDS: ContentField[] = [
  makeField({ id: 'config',       field_type: 'timed_tap_config',           sort_order: 0,   props: { duration_seconds: '90', max_word_length: '40', vibration_ms: '30' } }),
  makeField({ id: 'intro',        field_type: 'timed_tap_intro_text',       sort_order: 10,  text_code: 'modules.cognitive_saturation.intro_text' }),
  makeField({ id: 'input_title',  field_type: 'timed_tap_input_title',      sort_order: 20,  text_code: 'modules.cognitive_saturation.input_title' }),
  makeField({ id: 'input_hint',   field_type: 'timed_tap_input_hint',       sort_order: 30,  text_code: 'modules.cognitive_saturation.input_hint' }),
  makeField({ id: 'input_ph',     field_type: 'timed_tap_input_placeholder',sort_order: 40,  text_code: 'modules.cognitive_saturation.input_placeholder' }),
  makeField({ id: 'how_title',    field_type: 'timed_tap_how_title',        sort_order: 50,  text_code: 'modules.cognitive_saturation.how_it_works' }),
  makeField({ id: 'how_body',     field_type: 'timed_tap_how_body',         sort_order: 60,  text_code: 'modules.cognitive_saturation.instructions' }),
  makeField({ id: 'tap_hint',     field_type: 'timed_tap_tap_hint',         sort_order: 70,  text_code: 'modules.cognitive_saturation.tap_hint' }),
  makeField({ id: 'rep_label',    field_type: 'timed_tap_rep_label',        sort_order: 80,  text_code: 'modules.cognitive_saturation.repetitions' }),
  makeField({ id: 'done_title',   field_type: 'timed_tap_done_title',       sort_order: 90,  text_code: 'modules.cognitive_saturation.done_title' }),
  makeField({ id: 'done_text',    field_type: 'timed_tap_done_text',        sort_order: 100, text_code: 'modules.cognitive_saturation.done_text' }),
  makeField({ id: 'start_btn',    field_type: 'timed_tap_start_btn',        sort_order: 110, text_code: 'modules.cognitive_saturation.start_btn' }),
  makeField({ id: 'history_lbl',  field_type: 'timed_tap_history_label',    sort_order: 120, text_code: 'modules.cognitive_saturation.history_label' }),
  makeField({ id: 'empty_title',  field_type: 'timed_tap_empty_title',      sort_order: 130, text_code: 'modules.cognitive_saturation.empty_title' }),
  makeField({ id: 'empty_text',   field_type: 'timed_tap_empty_text',       sort_order: 140, text_code: 'modules.cognitive_saturation.empty_text' }),
  makeField({ id: 'rep_stat',     field_type: 'timed_tap_rep_stat_label',   sort_order: 150, text_code: 'modules.cognitive_saturation.repetitions_stat' }),
  makeField({ id: 'dur_stat',     field_type: 'timed_tap_duration_stat_label', sort_order: 160, text_code: 'modules.cognitive_saturation.duration_stat' }),
  makeField({ id: 'delete_lbl',   field_type: 'timed_tap_delete_label',     sort_order: 170, text_code: 'modules.cognitive_saturation.delete_session_title' }),
]

const MOCK_SESSION = {
  id: 'session-1',
  word: 'inutile',
  repetitions: 42,
  duration_seconds: 78,
  created_at: '2026-04-16T10:00:00.000Z',
}

function renderLayout() {
  return render(<FieldRenderer preview_kind="timed_tap_exercise" fields={MOCK_FIELDS} />)
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('FieldRenderer — timed_tap_exercise (TimedTapExerciseLayout)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    ;(database.getAllCognitiveSaturationSessions as jest.Mock).mockResolvedValue([])
    ;(database.saveCognitiveSaturationSession as jest.Mock).mockResolvedValue(undefined)
    ;(database.deleteCognitiveSaturationSession as jest.Mock).mockResolvedValue(undefined)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  // ── Mode historique ──────────────────────────────────────────────────────────

  it('affiche l\'état vide quand il n\'y a pas de sessions', async () => {
    renderLayout()
    expect(await screen.findByTestId('empty-state')).toBeTruthy()
    expect(screen.getByText('Aucune session')).toBeTruthy()
  })

  it('affiche la carte d\'introduction', async () => {
    renderLayout()
    expect(await screen.findByTestId('intro-card')).toBeTruthy()
  })

  it('affiche le bouton Démarrer un exercice', async () => {
    renderLayout()
    expect(await screen.findByTestId('start-exercise-button')).toBeTruthy()
  })

  it('passe en mode saisie au tap sur le bouton Démarrer', async () => {
    renderLayout()
    fireEvent.press(await screen.findByTestId('start-exercise-button'))
    expect(screen.getByTestId('input-card')).toBeTruthy()
  })

  it('affiche les sessions existantes', async () => {
    ;(database.getAllCognitiveSaturationSessions as jest.Mock).mockResolvedValue([MOCK_SESSION])
    renderLayout()
    expect(await screen.findByTestId('session-card-session-1')).toBeTruthy()
    expect(screen.getByText('inutile')).toBeTruthy()
    expect(screen.getByText('42 répétitions')).toBeTruthy()
    expect(screen.getByText('1min 18s')).toBeTruthy()
  })

  it('affiche le compte de sessions dans le titre de section', async () => {
    ;(database.getAllCognitiveSaturationSessions as jest.Mock).mockResolvedValue([MOCK_SESSION])
    renderLayout()
    expect(await screen.findByText('Historique (1)')).toBeTruthy()
  })

  it('supprime une session via le bouton poubelle', async () => {
    ;(database.getAllCognitiveSaturationSessions as jest.Mock).mockResolvedValue([MOCK_SESSION])
    renderLayout()
    await screen.findByTestId('session-card-session-1')
    fireEvent.press(screen.getByLabelText('Supprimer cette session ?'))
    expect(database.deleteCognitiveSaturationSession).toBeDefined()
  })

  // ── Mode saisie ──────────────────────────────────────────────────────────────

  it('affiche le champ de saisie', async () => {
    renderLayout()
    fireEvent.press(await screen.findByTestId('start-exercise-button'))
    expect(screen.getByTestId('input-card')).toBeTruthy()
    expect(screen.getByTestId('word-input')).toBeTruthy()
  })

  it('affiche le compteur de caractères', async () => {
    renderLayout()
    fireEvent.press(await screen.findByTestId('start-exercise-button'))
    expect(screen.getByTestId('char-count')).toBeTruthy()
    expect(screen.getByText('0/40')).toBeTruthy()
  })

  it('met à jour le compteur de caractères en tapant', async () => {
    renderLayout()
    fireEvent.press(await screen.findByTestId('start-exercise-button'))
    fireEvent.changeText(screen.getByTestId('word-input'), 'inutile')
    expect(screen.getByText('7/40')).toBeTruthy()
  })

  it('le bouton Démarrer est désactivé si le champ est vide', async () => {
    renderLayout()
    fireEvent.press(await screen.findByTestId('start-exercise-button'))
    const btn = screen.getByTestId('confirm-start-button')
    expect(btn.props.accessibilityState?.disabled ?? btn.props.disabled).toBeTruthy()
  })

  it('le bouton Démarrer est actif quand un mot est saisi', async () => {
    renderLayout()
    fireEvent.press(await screen.findByTestId('start-exercise-button'))
    fireEvent.changeText(screen.getByTestId('word-input'), 'danger')
    const btn = screen.getByTestId('confirm-start-button')
    expect(btn.props.accessibilityState?.disabled ?? btn.props.disabled).toBeFalsy()
  })

  // ── Mode exercice ────────────────────────────────────────────────────────────

  it('passe en mode exercice après avoir appuyé sur Démarrer', async () => {
    renderLayout()
    fireEvent.press(await screen.findByTestId('start-exercise-button'))
    fireEvent.changeText(screen.getByTestId('word-input'), 'danger')
    fireEvent.press(screen.getByTestId('confirm-start-button'))
    expect(screen.getByTestId('exercise-mode')).toBeTruthy()
  })

  it('affiche le mot dans la zone de tap', async () => {
    renderLayout()
    fireEvent.press(await screen.findByTestId('start-exercise-button'))
    fireEvent.changeText(screen.getByTestId('word-input'), 'danger')
    fireEvent.press(screen.getByTestId('confirm-start-button'))
    expect(screen.getByText('danger')).toBeTruthy()
  })

  it('affiche le compteur à 0 au démarrage', async () => {
    renderLayout()
    fireEvent.press(await screen.findByTestId('start-exercise-button'))
    fireEvent.changeText(screen.getByTestId('word-input'), 'danger')
    fireEvent.press(screen.getByTestId('confirm-start-button'))
    expect(screen.getByTestId('rep-counter').props.children).toBe(0)
  })

  it('incrémente le compteur à chaque tap', async () => {
    renderLayout()
    fireEvent.press(await screen.findByTestId('start-exercise-button'))
    fireEvent.changeText(screen.getByTestId('word-input'), 'danger')
    fireEvent.press(screen.getByTestId('confirm-start-button'))
    fireEvent.press(screen.getByTestId('word-tap-button'))
    fireEvent.press(screen.getByTestId('word-tap-button'))
    fireEvent.press(screen.getByTestId('word-tap-button'))
    expect(screen.getByTestId('rep-counter').props.children).toBe(3)
  })

  it('affiche la barre de progression et le timer', async () => {
    renderLayout()
    fireEvent.press(await screen.findByTestId('start-exercise-button'))
    fireEvent.changeText(screen.getByTestId('word-input'), 'danger')
    fireEvent.press(screen.getByTestId('confirm-start-button'))
    expect(screen.getByTestId('progress-bar')).toBeTruthy()
    expect(screen.getByTestId('time-label')).toBeTruthy()
  })

  // ── Arrêt anticipé / fin par timer ──────────────────────────────────────────

  it('passe en mode terminé en appuyant sur Stop', async () => {
    renderLayout()
    fireEvent.press(await screen.findByTestId('start-exercise-button'))
    fireEvent.changeText(screen.getByTestId('word-input'), 'danger')
    fireEvent.press(screen.getByTestId('confirm-start-button'))
    fireEvent.press(screen.getByTestId('stop-button'))
    expect(screen.getByTestId('done-card')).toBeTruthy()
  })

  it('passe en mode terminé quand le timer atteint 0', async () => {
    renderLayout()
    await screen.findByTestId('start-exercise-button')
    fireEvent.press(screen.getByTestId('start-exercise-button'))
    fireEvent.changeText(screen.getByTestId('word-input'), 'danger')
    fireEvent.press(screen.getByTestId('confirm-start-button'))
    await act(async () => { jest.advanceTimersByTime(90_000) })
    expect(screen.getByTestId('done-card')).toBeTruthy()
  })

  // ── Mode terminé ─────────────────────────────────────────────────────────────

  it('affiche la carte récapitulative avec le mot et les stats', async () => {
    renderLayout()
    fireEvent.press(await screen.findByTestId('start-exercise-button'))
    fireEvent.changeText(screen.getByTestId('word-input'), 'danger')
    fireEvent.press(screen.getByTestId('confirm-start-button'))
    fireEvent.press(screen.getByTestId('word-tap-button'))
    fireEvent.press(screen.getByTestId('word-tap-button'))
    fireEvent.press(screen.getByTestId('stop-button'))
    expect(screen.getByTestId('summary-card')).toBeTruthy()
    expect(screen.getByText('danger')).toBeTruthy()
    expect(screen.getByTestId('done-repetitions').props.children).toBe(2)
  })

  it('enregistre la session et revient à l\'historique', async () => {
    renderLayout()
    fireEvent.press(await screen.findByTestId('start-exercise-button'))
    fireEvent.changeText(screen.getByTestId('word-input'), 'inutile')
    fireEvent.press(screen.getByTestId('confirm-start-button'))
    fireEvent.press(screen.getByTestId('stop-button'))
    fireEvent.press(screen.getByTestId('save-button'))

    await waitFor(() => {
      expect(database.saveCognitiveSaturationSession).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'test-uuid-1234', word: 'inutile' })
      )
    })
    expect(screen.getByTestId('start-exercise-button')).toBeTruthy()
  })

  it('revient au mode saisie après Recommencer', async () => {
    renderLayout()
    fireEvent.press(await screen.findByTestId('start-exercise-button'))
    fireEvent.changeText(screen.getByTestId('word-input'), 'danger')
    fireEvent.press(screen.getByTestId('confirm-start-button'))
    fireEvent.press(screen.getByTestId('stop-button'))
    fireEvent.press(screen.getByTestId('restart-button'))
    expect(screen.getByTestId('input-card')).toBeTruthy()
    expect(screen.getByTestId('word-input').props.value).toBe('')
  })

  // ── Config via props ─────────────────────────────────────────────────────────

  it('respecte max_word_length configuré dans les champs', async () => {
    const customFields = MOCK_FIELDS.map(f =>
      f.field_type === 'timed_tap_config'
        ? { ...f, props: { ...f.props, max_word_length: '10' } }
        : f
    )
    render(<FieldRenderer preview_kind="timed_tap_exercise" fields={customFields} />)
    fireEvent.press(await screen.findByTestId('start-exercise-button'))
    expect(screen.getByText('0/10')).toBeTruthy()
  })
})
