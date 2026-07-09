jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons')

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { Linking } from 'react-native'
import { CallableContact } from './CallableContact'

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as never)
})

describe('CallableContact', () => {
  it('affiche le nom et un bouton d\'appel quand un numéro est présent', () => {
    render(<CallableContact name="Marie" phone="0102030405" accentColor="#9333EA" callAccessibilityLabel="Appeler Marie" testID="contact-c1" />)
    expect(screen.getByText('Marie')).toBeTruthy()
    expect(screen.getByText('0102030405')).toBeTruthy()
    expect(screen.getByTestId('contact-c1-call')).toBeTruthy()
  })

  it('compose tel: au tap sur le bouton d\'appel', () => {
    render(<CallableContact name="Marie" phone="0102030405" accentColor="#9333EA" callAccessibilityLabel="Appeler Marie" testID="contact-c1" />)
    fireEvent.press(screen.getByTestId('contact-c1-call'))
    expect(Linking.openURL).toHaveBeenCalledWith('tel:0102030405')
  })

  it('n\'affiche aucun bouton d\'appel quand le numéro est absent', () => {
    render(<CallableContact name="Sans numéro" phone={null} accentColor="#9333EA" callAccessibilityLabel="Appeler" testID="contact-c2" />)
    expect(screen.getByText('Sans numéro')).toBeTruthy()
    expect(screen.queryByTestId('contact-c2-call')).toBeNull()
  })

  it('traite une chaîne vide comme une absence de numéro', () => {
    render(<CallableContact name="Vide" phone="" accentColor="#9333EA" callAccessibilityLabel="Appeler" testID="contact-c3" />)
    expect(screen.queryByTestId('contact-c3-call')).toBeNull()
  })
})
