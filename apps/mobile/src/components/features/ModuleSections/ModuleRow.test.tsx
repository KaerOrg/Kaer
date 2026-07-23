import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { ModuleRow } from './ModuleRow'
import type { UnlockedModule } from '@services/homeService'

const mod: UnlockedModule = {
  id: 'pm-1',
  module_type: 'crisis_plan',
  config: {},
  unlocked_at: '2026-01-01',
  module: { mobile_icon: 'target', color: '#000', preview_kind: 'form', category_id: 'safety' },
}

const baseProps = {
  mod,
  title: 'Plan de crise',
  subtitle: 'Plan personnalisé',
  comingSoonLabel: 'Bientôt disponible',
}

describe('ModuleRow', () => {
  it('affiche le titre et le sous-titre', () => {
    render(<ModuleRow {...baseProps} available onSelect={jest.fn()} />)
    expect(screen.getByText('Plan de crise')).toBeTruthy()
    expect(screen.getByText('Plan personnalisé')).toBeTruthy()
  })

  it('appelle onSelect avec le module quand il est disponible', () => {
    const onSelect = jest.fn()
    render(<ModuleRow {...baseProps} available onSelect={onSelect} />)
    fireEvent.press(screen.getByLabelText('Plan de crise'))
    expect(onSelect).toHaveBeenCalledWith(mod)
  })

  it('affiche le libellé "bientôt" et ne déclenche pas onSelect si indisponible', () => {
    const onSelect = jest.fn()
    render(<ModuleRow {...baseProps} available={false} onSelect={onSelect} />)
    expect(screen.getByText('Bientôt disponible')).toBeTruthy()
    fireEvent.press(screen.getByLabelText('Plan de crise'))
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('n\'affiche pas de sous-titre si absent', () => {
    render(<ModuleRow {...baseProps} subtitle={undefined} available onSelect={jest.fn()} />)
    expect(screen.queryByText('Plan personnalisé')).toBeNull()
  })
})
