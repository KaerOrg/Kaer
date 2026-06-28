jest.mock('../../../../../hooks/useModuleT', () => ({
  useModuleTranslation: () => (key: string) => key,
}))

jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons')

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { TreeSelectorHeader } from './TreeSelectorHeader'

const baseProps = {
  onBack: jest.fn(),
  showProgress: true,
  accentColor: '#F59E0B',
  breadcrumb: 'Joie › Plaisir',
  progress: 0.5,
}

describe('TreeSelectorHeader', () => {
  it('rend le bouton retour et appelle onBack au tap', () => {
    const onBack = jest.fn()
    render(<TreeSelectorHeader {...baseProps} onBack={onBack} />)
    fireEvent.press(screen.getByTestId('back-button'))
    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it('affiche la progression et le fil d\'Ariane quand showProgress', () => {
    render(<TreeSelectorHeader {...baseProps} />)
    expect(screen.getByText('Joie › Plaisir')).toBeTruthy()
  })

  it('masque la progression quand showProgress est faux', () => {
    render(<TreeSelectorHeader {...baseProps} showProgress={false} />)
    expect(screen.queryByText('Joie › Plaisir')).toBeNull()
  })
})
