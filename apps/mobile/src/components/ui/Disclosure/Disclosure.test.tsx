import React from 'react'
import { Text } from 'react-native'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { Disclosure } from './Disclosure'

jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons')

describe('Disclosure', () => {
  it('affiche le libellé et masque le contenu quand il est fermé', () => {
    render(
      <Disclosure label="Voir le détail" open={false} onToggle={() => {}}>
        <Text>contenu caché</Text>
      </Disclosure>
    )
    expect(screen.getByText('Voir le détail')).toBeTruthy()
    expect(screen.queryByText('contenu caché')).toBeNull()
  })

  it('révèle le contenu quand il est ouvert', () => {
    render(
      <Disclosure label="Voir le détail" open onToggle={() => {}}>
        <Text>contenu révélé</Text>
      </Disclosure>
    )
    expect(screen.getByText('contenu révélé')).toBeTruthy()
  })

  it('demande l\'ouverture quand il est fermé', () => {
    const onToggle = jest.fn()
    render(
      <Disclosure label="Voir le détail" open={false} onToggle={onToggle}>
        <Text>x</Text>
      </Disclosure>
    )
    fireEvent.press(screen.getByText('Voir le détail'))
    expect(onToggle).toHaveBeenCalledWith(true)
  })

  it('demande la fermeture quand il est ouvert', () => {
    const onToggle = jest.fn()
    render(
      <Disclosure label="Voir le détail" open onToggle={onToggle}>
        <Text>x</Text>
      </Disclosure>
    )
    fireEvent.press(screen.getByLabelText('Voir le détail'))
    expect(onToggle).toHaveBeenCalledWith(false)
  })

  it('expose son état à l\'accessibilité', () => {
    const { rerender } = render(
      <Disclosure label="Voir le détail" open={false} onToggle={() => {}}>
        <Text>x</Text>
      </Disclosure>
    )
    expect(screen.getByLabelText('Voir le détail').props.accessibilityState.expanded).toBe(false)
    rerender(
      <Disclosure label="Voir le détail" open onToggle={() => {}}>
        <Text>x</Text>
      </Disclosure>
    )
    expect(screen.getByLabelText('Voir le détail').props.accessibilityState.expanded).toBe(true)
  })
})
