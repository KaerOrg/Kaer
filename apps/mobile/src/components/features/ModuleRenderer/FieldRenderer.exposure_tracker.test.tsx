jest.mock('../../../hooks/useTeen', () => ({
  useTeen: () => ({ isTeenMode: false, tt: () => '', tg: () => '', teenColor: () => undefined }),
}))

jest.mock('../../../lib/database', () => ({
  // Données lues par le parcours d'exposition
  getAllFearEntries: jest.fn().mockResolvedValue([]),
  getAllFearSituations: jest.fn().mockResolvedValue([]),
  generateId: jest.fn().mockReturnValue('new-id-1'),
}))

// Mutations passent par le service (et non plus par lib/database directement)
jest.mock('../../../services/fearTrackerService', () => ({
  saveFearEntry: jest.fn().mockResolvedValue(undefined),
  deleteFearEntry: jest.fn().mockResolvedValue(undefined),
  saveFearSituation: jest.fn().mockResolvedValue(undefined),
  deleteFearSituation: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('../../../lib/dateUtils', () => ({
  formatDateShortYear: (str: string) => `sy:${str}`,
}))

jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons')

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native'
import { FieldRenderer } from './FieldRenderer'
import * as database from '../../../lib/database'
import * as service from '../../../services/fearTrackerService'
import type { ContentField } from '../../../services/moduleService'
import type { FearEntry, FearSituation } from '../../../lib/database'

jest.setTimeout(15000)

function makeField(overrides: Partial<ContentField>): ContentField {
  return {
    id: overrides.id ?? 'f',
    module_id: 'fear_thermometer',
    section_id: null,
    parent_field_id: null,
    field_type: overrides.field_type ?? 'exposure_tracker_config',
    text_code: overrides.text_code ?? null,
    sort_order: overrides.sort_order ?? 0,
    props: overrides.props ?? {},
    children: [],
  }
}

const MOCK_FIELDS: ContentField[] = [
  makeField({
    id: 'et.cfg', field_type: 'exposure_tracker_config', sort_order: 0,
    props: { suds_min: '0', suds_max: '100', suds_step: '10', suds_default_before: '50' },
  }),
  makeField({ id: 'et.strategy_breathing', field_type: 'exposure_tracker_strategy', sort_order: 100, text_code: 'modules.fear_thermometer.strategy_breathing' }),
  makeField({ id: 'et.strategy_grounding', field_type: 'exposure_tracker_strategy', sort_order: 101, text_code: 'modules.fear_thermometer.strategy_grounding' }),
]

const MOCK_STEP: FearSituation = {
  id: 'sit-1', label: 'Prendre le métro', hierarchy_id: null,
  target_suds: 40, is_done: 0, created_at: '2026-05-01T10:00:00Z',
}

const MOCK_ENTRY: FearEntry = {
  id: 'entry-1', date: '2026-05-06', situation_id: 'sit-1', situation_label: 'Prendre le métro',
  suds_before: 70, suds_peak: 85, strategies: '{"selected":["et.strategy_breathing"],"custom":""}',
  custom_strategy: null, suds_after: 30, expectation_text: 'Je vais paniquer',
  outcome_text: 'Ça a tenu', notes: null, created_at: '2026-05-06T10:00:00Z',
}

function renderLayout() {
  return render(
    <FieldRenderer preview_kind="exposure_tracker" fields={MOCK_FIELDS} moduleId="fear_thermometer" />
  )
}

describe('FieldRenderer — exposure_tracker (parcours unifié)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(database.getAllFearEntries as jest.Mock).mockResolvedValue([])
    ;(database.getAllFearSituations as jest.Mock).mockResolvedValue([])
    ;(database.generateId as jest.Mock).mockReturnValue('new-id-1')
  })

  it('charge les données et affiche l\'échelle vide', async () => {
    renderLayout()
    await waitFor(() => {
      expect(database.getAllFearSituations).toHaveBeenCalled()
      expect(database.getAllFearEntries).toHaveBeenCalled()
    })
    expect(await screen.findByTestId('ladder-empty')).toBeTruthy()
  })

  it('affiche les marches classées', async () => {
    ;(database.getAllFearSituations as jest.Mock).mockResolvedValue([MOCK_STEP])
    renderLayout()
    expect(await screen.findByTestId('step-sit-1')).toBeTruthy()
  })

  it('ouvre le formulaire d\'ajout de marche depuis le FAB', async () => {
    renderLayout()
    fireEvent.press(await screen.findByTestId('add-step-fab'))
    expect(await screen.findByTestId('exposure-step-form')).toBeTruthy()
  })

  it('enregistre une nouvelle marche', async () => {
    renderLayout()
    fireEvent.press(await screen.findByTestId('add-step-fab'))
    await screen.findByTestId('exposure-step-form')
    fireEvent.changeText(screen.getByTestId('step-label-input'), 'Prendre l\'avion')
    await act(async () => { fireEvent.press(screen.getByTestId('step-save')) })
    await waitFor(() => {
      expect(service.saveFearSituation).toHaveBeenCalledWith(
        expect.objectContaining({ label: 'Prendre l\'avion', target_suds: 50 }),
      )
    })
  })

  it('coche une marche comme franchie', async () => {
    ;(database.getAllFearSituations as jest.Mock).mockResolvedValue([MOCK_STEP])
    renderLayout()
    const checkbox = await screen.findByTestId('step-done-sit-1')
    await act(async () => { fireEvent.press(checkbox) })
    await waitFor(() => {
      expect(service.saveFearSituation).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'sit-1', is_done: 1 }),
      )
    })
  })

  it('ouvre le détail d\'une marche', async () => {
    ;(database.getAllFearSituations as jest.Mock).mockResolvedValue([MOCK_STEP])
    renderLayout()
    fireEvent.press(await screen.findByTestId('step-sit-1'))
    expect(await screen.findByTestId('exposure-step-detail')).toBeTruthy()
    expect(screen.getByTestId('do-exposure-btn')).toBeTruthy()
  })

  it('lance et enregistre une exposition sur une marche', async () => {
    ;(database.getAllFearSituations as jest.Mock).mockResolvedValue([MOCK_STEP])
    renderLayout()
    fireEvent.press(await screen.findByTestId('step-sit-1'))
    fireEvent.press(await screen.findByTestId('do-exposure-btn'))
    await screen.findByTestId('exposure-form')
    fireEvent.changeText(screen.getByTestId('expectation-input'), 'Je vais paniquer')
    await act(async () => { fireEvent.press(screen.getByTestId('exposure-save')) })
    await waitFor(() => {
      expect(service.saveFearEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          situation_id: 'sit-1',
          situation_label: 'Prendre le métro',
          suds_before: 50,
          expectation_text: 'Je vais paniquer',
          date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        }),
      )
    })
  })

  it('édite une exposition existante depuis le détail', async () => {
    ;(database.getAllFearSituations as jest.Mock).mockResolvedValue([MOCK_STEP])
    ;(database.getAllFearEntries as jest.Mock).mockResolvedValue([MOCK_ENTRY])
    renderLayout()
    fireEvent.press(await screen.findByTestId('step-sit-1'))
    fireEvent.press(await screen.findByTestId('edit-entry-1'))
    await screen.findByTestId('exposure-form')
    expect(screen.getByTestId('exposure-delete')).toBeTruthy()
    await act(async () => { fireEvent.press(screen.getByTestId('exposure-save')) })
    await waitFor(() => {
      expect(service.saveFearEntry).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'entry-1', situation_id: 'sit-1' }),
      )
    })
  })

  it('supprime une exposition après confirmation', async () => {
    ;(database.getAllFearSituations as jest.Mock).mockResolvedValue([MOCK_STEP])
    ;(database.getAllFearEntries as jest.Mock).mockResolvedValue([MOCK_ENTRY])
    renderLayout()
    fireEvent.press(await screen.findByTestId('step-sit-1'))
    const del = await screen.findByTestId('delete-entry-1')
    await act(async () => { fireEvent.press(del) })
    await waitFor(() => {
      expect(service.deleteFearEntry).toHaveBeenCalledWith('entry-1')
    })
  })

  it('supprime une marche après confirmation', async () => {
    ;(database.getAllFearSituations as jest.Mock).mockResolvedValue([MOCK_STEP])
    renderLayout()
    fireEvent.press(await screen.findByTestId('step-sit-1'))
    const del = await screen.findByTestId('detail-delete-step')
    await act(async () => { fireEvent.press(del) })
    await waitFor(() => {
      expect(service.deleteFearSituation).toHaveBeenCalledWith('sit-1')
    })
  })
})
