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

jest.mock('../../../services/engagementService', () => ({
  logEvent: jest.fn().mockResolvedValue(undefined),
}))

const teenModeRef = { current: false }
jest.mock('../../../store/authStore', () => ({
  useAuthStore: (selector: (s: { patient: { id: string }; teenMode: boolean }) => unknown) =>
    selector({ patient: { id: 'patient-test-id' }, teenMode: teenModeRef.current }),
}))

jest.mock('../../../services/psyeduService', () => ({
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
import { render, screen } from '@testing-library/react-native'
import { FieldRenderer } from './FieldRenderer'
import type { ContentField } from '../../../services/moduleService'

jest.setTimeout(15000)

function makeField(overrides: Partial<ContentField> & { children?: ContentField[] }): ContentField {
  return {
    id: overrides.id ?? 'f',
    module_id: overrides.module_id ?? 'craving_journal',
    section_id: overrides.section_id ?? null,
    parent_field_id: overrides.parent_field_id ?? null,
    field_type: overrides.field_type ?? 'disclaimer_banner',
    text_code: overrides.text_code ?? null,
    sort_order: overrides.sort_order ?? 0,
    props: overrides.props ?? {},
    children: overrides.children ?? [],
  }
}

const DISCLAIMER_FIELD = makeField({
  id: 'disclaimer',
  field_type: 'disclaimer_banner',
  sort_order: 0,
  props: { module_key: 'craving_journal' },
})

describe('FieldRenderer — disclaimer_banner', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    teenModeRef.current = false
  })

  it('rend le bandeau au-dessus du layout quand le field disclaimer_banner est présent', () => {
    render(
      <FieldRenderer
        preview_kind="psyedu"
        fields={[DISCLAIMER_FIELD]}
        moduleId="craving_journal"
      />
    )
    // Texte du disclaimer i18n résolu (fr/common.json)
    expect(screen.getByText(/support à vos consultations/i)).toBeTruthy()
  })

  it('ne rend pas le bandeau quand aucun field disclaimer_banner', () => {
    render(
      <FieldRenderer
        preview_kind="psyedu"
        fields={[]}
        moduleId="craving_journal"
      />
    )
    expect(screen.queryByText(/support à vos consultations/i)).toBeNull()
  })

  it('utilise moduleId comme module_key par défaut', () => {
    const fieldWithoutKey = makeField({
      id: 'disclaimer',
      field_type: 'disclaimer_banner',
      sort_order: 0,
      props: {},
    })
    render(
      <FieldRenderer
        preview_kind="psyedu"
        fields={[fieldWithoutKey]}
        moduleId="distress_tolerance"
      />
    )
    // distress_tolerance.disclaimer existe aussi dans fr/common.json
    expect(screen.getByText(/support à vos consultations/i)).toBeTruthy()
  })

  it('filtre le field disclaimer_banner avant de passer au layout', () => {
    // Le tabbed layout n'a pas de tabs si le seul field est disclaimer →
    // FieldRenderer wrapper rend le bandeau, mais le layout interne renvoie
    // null. Test : pas d'erreur, banner présent, layout absent.
    const result = render(
      <FieldRenderer
        preview_kind="tabbed"
        fields={[DISCLAIMER_FIELD]}
        moduleId="craving_journal"
      />
    )
    expect(screen.getByText(/support à vos consultations/i)).toBeTruthy()
    expect(result.queryByTestId('tabs-layout')).toBeNull()
  })
})
