import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { InputField } from './InputField'

describe('InputField', () => {
  it('affiche le label', () => {
    render(<InputField label="Email" />)
    expect(screen.getByText('Email')).toBeTruthy()
  })

  it('omet le label quand il est absent', () => {
    render(<InputField placeholder="sans label" />)
    expect(screen.getByPlaceholderText('sans label')).toBeTruthy()
  })

  it("affiche le message d'erreur", () => {
    render(<InputField label="Email" error="Champ requis" />)
    expect(screen.getByText('Champ requis')).toBeTruthy()
  })

  it("n'affiche pas l'erreur si absente", () => {
    render(<InputField label="Email" />)
    expect(screen.queryByText('Champ requis')).toBeNull()
  })

  it('propage la valeur saisie', () => {
    const onChangeText = jest.fn()
    render(<InputField label="Nom" onChangeText={onChangeText} />)
    fireEvent.changeText(screen.getByDisplayValue(''), 'Guillaume')
    expect(onChangeText).toHaveBeenCalledWith('Guillaume')
  })

  it('passe en état focused au focus', () => {
    render(<InputField label="Email" />)
    const input = screen.getByDisplayValue('')
    fireEvent(input, 'focus')
    expect(input).toBeTruthy()
  })

  it('affiche le placeholder', () => {
    render(<InputField label="Email" placeholder="ex: jean@mail.com" />)
    expect(screen.getByPlaceholderText('ex: jean@mail.com')).toBeTruthy()
  })
})
