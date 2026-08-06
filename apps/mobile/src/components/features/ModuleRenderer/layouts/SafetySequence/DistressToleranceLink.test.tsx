const mockNavigate = jest.fn()
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}))
jest.mock('../../../../../hooks/useModuleT', () => ({
  useModuleTranslation: () => (k: string) => k,
}))

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { DistressToleranceLink } from './DistressToleranceLink'

beforeEach(() => jest.clearAllMocks())

describe('DistressToleranceLink', () => {
  // Le libellé vient du module CIBLE : c'est lui qui nomme ce qu'il propose.
  it('emprunte son libellé et son mécanisme aux clés du module cible', () => {
    render(<DistressToleranceLink testID="link" />)
    expect(screen.getByText('modules.distress_tolerance.crisis_link_label')).toBeTruthy()
    expect(screen.getByText('modules.distress_tolerance.crisis_link_hint')).toBeTruthy()
  })

  // En crise, on n'arrive pas sur une page de lecture : l'override ouvre directement
  // le compagnon de crise, sans passer par l'onglet « Comprendre ».
  it('ouvre le compagnon de crise du module cible', () => {
    render(<DistressToleranceLink testID="link" />)
    fireEvent.press(screen.getByTestId('link'))
    expect(mockNavigate).toHaveBeenCalledWith('ModuleContent', {
      moduleType: 'distress_tolerance',
      previewKindOverride: 'crisis_companion',
    })
  })

  it('porte son libellé en accessibilité, la carte entière étant la cible', () => {
    render(<DistressToleranceLink testID="link" />)
    expect(screen.getByTestId('link').props.accessibilityLabel)
      .toBe('modules.distress_tolerance.crisis_link_label')
  })
})
