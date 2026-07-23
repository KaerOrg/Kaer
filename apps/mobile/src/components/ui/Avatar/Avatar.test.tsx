import React from 'react'
import { render } from '@testing-library/react-native'
import { Avatar, initialsFromName } from './Avatar'

describe('initialsFromName', () => {
  it('ignore le titre honorifique et prend les deux derniers mots', () => {
    expect(initialsFromName('Dr Claire Lemoine')).toBe('CL')
  })
  it('prend les deux mots quand il n’y a pas de titre', () => {
    expect(initialsFromName('Claire Lemoine')).toBe('CL')
  })
  it('gère un nom en un seul mot', () => {
    expect(initialsFromName('Lemoine')).toBe('L')
  })
  it('gère une chaîne vide', () => {
    expect(initialsFromName('   ')).toBe('?')
  })
})

describe('Avatar', () => {
  it('affiche les initiales dérivées du nom sans photo', () => {
    const { getByText } = render(<Avatar name="Dr Claire Lemoine" />)
    expect(getByText('CL')).toBeTruthy()
  })

  it('affiche la photo à la place des initiales quand uri est fourni', () => {
    const { getByTestId, queryByText } = render(
      <Avatar name="Dr Claire Lemoine" uri="https://example.com/a.jpg" testID="avatar-img" />,
    )
    expect(getByTestId('avatar-img')).toBeTruthy()
    expect(queryByText('CL')).toBeNull()
  })
})
