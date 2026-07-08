jest.mock('../../../../../hooks/useModuleT', () => ({
  useModuleTranslation: () => (k: string) => k,
}))
jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons')

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { Linking } from 'react-native'
import { CrisisEmergencyCalls } from './CrisisEmergencyCalls'
import type { ContentField } from '@services/moduleService'

function field(over: Partial<ContentField>): ContentField {
  return {
    id: over.id ?? 'f',
    module_id: 'crisis_plan',
    section_id: null,
    parent_field_id: null,
    field_type: over.field_type ?? 'exercise_safety',
    text_code: over.text_code ?? null,
    sort_order: over.sort_order ?? 0,
    props: over.props ?? {},
    children: [],
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as never)
})

describe('CrisisEmergencyCalls', () => {
  it('ne rend rien sans field exercise_safety', () => {
    const { toJSON } = render(<CrisisEmergencyCalls fields={[field({ field_type: 'step_title' })]} />)
    expect(toJSON()).toBeNull()
  })

  it('rend un bouton par numéro, trié par sort_order, et appelle tel: au tap', () => {
    render(<CrisisEmergencyCalls fields={[
      field({ id: 'b', text_code: 'num.3114', sort_order: 140, props: { phone: '3114', bgColor: '#7C3AED', label_code: 'lbl.3114' } }),
      field({ id: 'a', text_code: 'num.15', sort_order: 130, props: { phone: '15', bgColor: '#0D9488' } }),
    ]} />)
    expect(screen.getByTestId('emergency-15')).toBeTruthy()
    expect(screen.getByTestId('emergency-3114')).toBeTruthy()
    // label_code rendu quand présent
    expect(screen.getByText('lbl.3114')).toBeTruthy()

    fireEvent.press(screen.getByTestId('emergency-15'))
    expect(Linking.openURL).toHaveBeenCalledWith('tel:15')
  })
})
