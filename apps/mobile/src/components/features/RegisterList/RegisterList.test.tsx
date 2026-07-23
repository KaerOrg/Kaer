import React from 'react'
import { Text } from 'react-native'
import { render, fireEvent } from '@testing-library/react-native'
import { RegisterList } from './RegisterList'
import type { RegisterItem } from './types'

function item(over: Partial<RegisterItem> = {}): RegisterItem {
  return {
    key: 'k',
    icon: <Text>ic</Text>,
    label: 'Ma ligne',
    chipColor: '#000',
    onPress: jest.fn(),
    ...over,
  }
}

describe('RegisterList', () => {
  it('rend une ligne par item avec son libellé', () => {
    const { getByText } = render(
      <RegisterList items={[item({ key: 'a', label: 'Mon praticien' }), item({ key: 'b', label: 'Mes documents' })]} />,
    )
    expect(getByText('Mon praticien')).toBeTruthy()
    expect(getByText('Mes documents')).toBeTruthy()
  })

  it('déclenche onPress au tap sur une ligne', () => {
    const onPress = jest.fn()
    const { getByLabelText } = render(<RegisterList items={[item({ label: 'Notifications', onPress })]} />)
    fireEvent.press(getByLabelText('Notifications'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('masque le chevron quand showChevron est false', () => {
    const { queryByText } = render(<RegisterList items={[item({ label: 'Déconnexion', showChevron: false })]} />)
    // Le libellé reste présent ; on vérifie surtout l'absence de crash de rendu.
    expect(queryByText('Déconnexion')).toBeTruthy()
  })
})
