import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { ModuleSections } from './ModuleSections'
import type { UnlockedModule } from '@services/homeService'

function mk(module_type: string, category_id: string): UnlockedModule {
  return {
    id: `pm-${module_type}`,
    module_type,
    config: {},
    unlocked_at: '2026-01-01',
    module: { mobile_icon: 'target', color: '#000', preview_kind: 'form', category_id },
  }
}

const baseProps = {
  isTeenMode: false,
  teenColor: () => undefined,
  isAvailable: () => true,
  onModulePress: jest.fn(),
}

describe('ModuleSections', () => {
  beforeEach(() => jest.clearAllMocks())

  it('affiche les libellés de section quand il y a plusieurs groupes', () => {
    render(
      <ModuleSections
        {...baseProps}
        modules={[mk('crisis_plan', 'safety'), mk('medication_side_effects', 'iatrogenic')]}
      />,
    )
    expect(screen.getByText('Sécurité & Gestion de Crise')).toBeTruthy()
    expect(screen.getByText('Surveillance Iatrogénique & Somatique')).toBeTruthy()
    expect(screen.getByText('Plan de crise')).toBeTruthy()
  })

  it('masque le libellé de section quand il n\'y a qu\'un groupe', () => {
    render(<ModuleSections {...baseProps} modules={[mk('crisis_plan', 'safety')]} />)
    expect(screen.queryByText('Sécurité & Gestion de Crise')).toBeNull()
    expect(screen.getByText('Plan de crise')).toBeTruthy()
  })

  it('appelle onModulePress avec le bon module au tap', () => {
    const onModulePress = jest.fn()
    const mod = mk('crisis_plan', 'safety')
    render(<ModuleSections {...baseProps} onModulePress={onModulePress} modules={[mod]} />)
    fireEvent.press(screen.getByLabelText('Plan de crise'))
    expect(onModulePress).toHaveBeenCalledWith(mod)
  })
})
