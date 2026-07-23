import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { ProfileIdentityHeader } from './ProfileIdentityHeader'

const BASE = {
  name: 'Guillaume Morel',
  avatarUri: null,
  sinceLabel: 'Suivi depuis mars 2025',
  onSettingsPress: jest.fn(),
  settingsLabel: 'Réglages',
}

describe('ProfileIdentityHeader', () => {
  it('affiche le nom, l’ancienneté et les initiales', () => {
    const { getByText } = render(<ProfileIdentityHeader {...BASE} />)
    expect(getByText('Guillaume Morel')).toBeTruthy()
    expect(getByText('Suivi depuis mars 2025')).toBeTruthy()
    expect(getByText('GM')).toBeTruthy()
  })

  it('affiche la photo à la place des initiales quand avatarUri est fourni', () => {
    const { queryByText } = render(
      <ProfileIdentityHeader {...BASE} avatarUri="https://example.com/avatar.jpg" />,
    )
    expect(queryByText('GM')).toBeNull()
  })

  it('omet la ligne d’ancienneté quand elle est vide', () => {
    const { queryByText } = render(<ProfileIdentityHeader {...BASE} sinceLabel="" />)
    expect(queryByText('Suivi depuis mars 2025')).toBeNull()
  })

  it('déclenche onSettingsPress au tap sur la roue crantée', () => {
    const onSettingsPress = jest.fn()
    const { getByLabelText } = render(<ProfileIdentityHeader {...BASE} onSettingsPress={onSettingsPress} />)
    fireEvent.press(getByLabelText('Réglages'))
    expect(onSettingsPress).toHaveBeenCalledTimes(1)
  })
})
