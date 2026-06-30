jest.mock('../../../hooks/useTeen', () => ({
  useTeen: () => ({ isTeenMode: false, tt: () => '', tg: () => '', teenColor: () => undefined }),
}))

jest.mock('../../../lib/database', () => ({
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
  generateId: jest.fn().mockReturnValue('test-id-1'),
}))

jest.mock('../../../lib/dateUtils', () => ({
  formatDateTime: (str: string) => str,
  formatDateFull: (str: string) => `full:${str}`,
  formatDateNumeric: (str: string) => `num:${str}`,
}))

jest.mock('../../../store/authStore', () => ({
  useAuthStore: (selector: (s: { patient: { id: string }; teenMode: boolean }) => unknown) =>
    selector({ patient: { id: 'patient-test-id' }, teenMode: false }),
}))

jest.mock('@services/psyeduService', () => ({
  fetchTopicsByModule: jest.fn().mockResolvedValue([]),
  fetchBlocksByTopic: jest.fn().mockResolvedValue([]),
  clearPsyEduCache: jest.fn(),
}))

jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons')
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }))
jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker')
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ setOptions: jest.fn() }),
}))

jest.mock('lucide-react-native', () => {
  const React = require('react')
  const Stub = (name: string) => (props: { size?: number; color?: string }) =>
    React.createElement('Icon', { ...props, name })
  return new Proxy({}, { get: (_, key) => Stub(String(key)) })
})

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import { FieldRenderer } from './FieldRenderer'
import type { ContentField } from '@services/moduleService'

jest.setTimeout(15000)

function makeField(overrides: Partial<ContentField> & { children?: ContentField[] }): ContentField {
  return {
    id: overrides.id ?? 'f',
    module_id: overrides.module_id ?? 'craving_journal',
    section_id: overrides.section_id ?? null,
    parent_field_id: overrides.parent_field_id ?? null,
    field_type: overrides.field_type ?? 'tab',
    text_code: overrides.text_code ?? null,
    sort_order: overrides.sort_order ?? 0,
    props: overrides.props ?? {},
    children: overrides.children ?? [],
  }
}

const TAB_FICHES = makeField({
  id: 'tab.fiches',
  field_type: 'tab',
  sort_order: 10,
  text_code: 'modules.craving_journal.tab_fiches',
  props: { tab_key: 'fiches', icon_name: 'BookOpen', sub_preview_kind: 'psyedu' },
  children: [],
})

const TAB_JOURNAL = makeField({
  id: 'tab.journal',
  field_type: 'tab',
  sort_order: 20,
  text_code: 'modules.craving_journal.tab_journal',
  props: { tab_key: 'journal', icon_name: 'PenLine', sub_preview_kind: 'column_form' },
  children: [
    makeField({
      id: 'cfg', field_type: 'column_form_config', sort_order: 0,
      props: {},
    }),
    makeField({
      id: 'col1.h', field_type: 'column_header', section_id: 'col1', sort_order: 10,
      text_code: 'modules.craving_journal.col1',
      props: { color: '#7C3AED', step_number: '1' },
      children: [
        makeField({
          id: 'col1.text', field_type: 'column_text_field', section_id: 'col1', parent_field_id: 'col1.h',
          sort_order: 11,
          text_code: 'modules.craving_journal.trigger_placeholder',
          props: { key: 'trigger', multiline: '1' },
        }),
      ],
    }),
  ],
})

describe('FieldRenderer — preview_kind="tabbed" (TabsLayout)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('rend une barre d\'onglets avec les tabs déclarés en BDD', () => {
    render(
      <FieldRenderer
        preview_kind="tabbed"
        fields={[TAB_FICHES, TAB_JOURNAL]}
        moduleId="craving_journal"
      />
    )
    expect(screen.getByTestId('tabs-layout')).toBeTruthy()
    expect(screen.getByTestId('tab-fiches')).toBeTruthy()
    expect(screen.getByTestId('tab-journal')).toBeTruthy()
  })

  it('rend le sous-layout du premier tab par défaut', async () => {
    render(
      <FieldRenderer
        preview_kind="tabbed"
        fields={[TAB_FICHES, TAB_JOURNAL]}
        moduleId="craving_journal"
      />
    )
    expect(screen.getByTestId('tab-content-fiches')).toBeTruthy()
    // Sous-layout psyedu chargé (état list ou empty selon mock)
    await waitFor(() => {
      expect(screen.queryByTestId('tab-content-journal')).toBeNull()
    })
  })

  it('change de tab au clic et rend le bon sous-layout', async () => {
    render(
      <FieldRenderer
        preview_kind="tabbed"
        fields={[TAB_FICHES, TAB_JOURNAL]}
        moduleId="craving_journal"
      />
    )
    fireEvent.press(screen.getByTestId('tab-journal'))
    expect(screen.getByTestId('tab-content-journal')).toBeTruthy()
    expect(screen.queryByTestId('tab-content-fiches')).toBeNull()
    // Le column_form sous-layout est monté → getAllFormEntries appelé avec moduleId
    await waitFor(() => {
      const db = require('../../../lib/database')
      expect(db.getAllFormEntries).toHaveBeenCalledWith('craving_journal')
    })
  })

  it('respecte sort_order des tabs', () => {
    const tabReversed = [{ ...TAB_JOURNAL, sort_order: 5 }, { ...TAB_FICHES, sort_order: 50 }]
    render(
      <FieldRenderer
        preview_kind="tabbed"
        fields={tabReversed}
        moduleId="craving_journal"
      />
    )
    // Le tab journal (sort_order=5) doit être affiché en premier (actif par défaut)
    expect(screen.getByTestId('tab-content-journal')).toBeTruthy()
    expect(screen.queryByTestId('tab-content-fiches')).toBeNull()
  })

  it('passe moduleId au sous-layout', async () => {
    render(
      <FieldRenderer
        preview_kind="tabbed"
        fields={[TAB_JOURNAL]}
        moduleId="my_module"
      />
    )
    await waitFor(() => {
      const db = require('../../../lib/database')
      expect(db.getAllFormEntries).toHaveBeenCalledWith('my_module')
    })
  })

  it('ne rend rien si aucun tab', () => {
    render(
      <FieldRenderer
        preview_kind="tabbed"
        fields={[]}
        moduleId="empty_module"
      />
    )
    expect(screen.queryByTestId('tabs-layout')).toBeNull()
  })
})
