jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons')

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { Linking } from 'react-native'
import { CallableContact } from './CallableContact'

const LABELS = { callLabel: 'Appeler', messageLabel: 'Envoyer un message', accentColor: '#9333EA' }

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as never)
})

describe('CallableContact — proche', () => {
  it('affiche le nom, son rôle et sa note, et propose les deux gestes', () => {
    render(<CallableContact name="Marie" phone="0102030405" role="ma sœur"
      note="Je peux lui dire que je ne vais pas bien" {...LABELS} testID="c1" />)
    expect(screen.getByText('Marie')).toBeTruthy()
    expect(screen.getByText('ma sœur')).toBeTruthy()
    expect(screen.getByText('Je peux lui dire que je ne vais pas bien')).toBeTruthy()
    expect(screen.getByTestId('c1-call')).toBeTruthy()
    expect(screen.getByTestId('c1-message')).toBeTruthy()
  })

  // Règle centrale de P-8 : un plan de sécurité s'ouvre dans un train ou une salle
  // d'attente. Le numéro ne doit jamais être lisible par-dessus l'épaule.
  it('n\'affiche JAMAIS le numéro de téléphone', () => {
    render(<CallableContact name="Marie" phone="0102030405" {...LABELS} testID="c1" />)
    expect(screen.queryByText('0102030405')).toBeNull()
    expect(screen.getByText('Appeler')).toBeTruthy()
  })

  it('compose tel: au tap sur le bouton d\'appel', () => {
    render(<CallableContact name="Marie" phone="0102030405" {...LABELS} testID="c1" />)
    fireEvent.press(screen.getByTestId('c1-call'))
    expect(Linking.openURL).toHaveBeenCalledWith('tel:0102030405')
  })

  it('compose sms: au tap sur le bouton de message', () => {
    render(<CallableContact name="Marie" phone="0102030405" {...LABELS} testID="c1" />)
    fireEvent.press(screen.getByTestId('c1-message'))
    expect(Linking.openURL).toHaveBeenCalledWith('sms:0102030405')
  })

  it('nomme le contact dans le libellé d\'accessibilité de chaque geste', () => {
    render(<CallableContact name="Marie" phone="0102030405" {...LABELS} testID="c1" />)
    expect(screen.getByTestId('c1-call').props.accessibilityLabel).toBe('Appeler : Marie')
    expect(screen.getByTestId('c1-message').props.accessibilityLabel).toBe('Envoyer un message : Marie')
  })
})

describe('CallableContact — sans numéro', () => {
  // Un item sans action ne doit jamais se lire comme un défaut : ni bouton grisé, ni
  // texte de remplacement, rien.
  it('ne rend ni numéro ni bouton, sans rien signaler', () => {
    render(<CallableContact name="Sans numéro" phone={null} {...LABELS} testID="c2" />)
    expect(screen.getByText('Sans numéro')).toBeTruthy()
    expect(screen.queryByTestId('c2-call')).toBeNull()
    expect(screen.queryByTestId('c2-message')).toBeNull()
  })

  it('traite une chaîne vide comme une absence de numéro', () => {
    render(<CallableContact name="Vide" phone="" {...LABELS} testID="c3" />)
    expect(screen.queryByTestId('c3-call')).toBeNull()
  })

  it('garde sa note quand il n\'a pas de numéro', () => {
    render(<CallableContact name="Paul" phone={null} note="Il répond mieux le soir" {...LABELS} testID="c4" />)
    expect(screen.getByText('Il répond mieux le soir')).toBeTruthy()
  })
})

describe('CallableContact — professionnel', () => {
  it('propose l\'appel mais jamais le message : un CMP ne se joint pas par SMS', () => {
    render(<CallableContact name="CMP Nord" phone="0203040506" role="mon centre" professional {...LABELS} testID="p1" />)
    expect(screen.getByTestId('p1-call')).toBeTruthy()
    expect(screen.queryByTestId('p1-message')).toBeNull()
  })
})

describe('CallableContact — lieu', () => {
  it('rend sa note et aucun bouton : on ne joint pas un lieu, on s\'y rend', () => {
    render(<CallableContact name="Le square derrière l'école" phone={null} kind="place"
      note="à 8 minutes à pied" {...LABELS} testID="l1" />)
    expect(screen.getByText('Le square derrière l\'école')).toBeTruthy()
    expect(screen.getByText('à 8 minutes à pied')).toBeTruthy()
    expect(screen.queryByTestId('l1-call')).toBeNull()
    expect(screen.queryByTestId('l1-message')).toBeNull()
  })

  it('n\'appelle pas un lieu, même s\'il porte un numéro', () => {
    render(<CallableContact name="La médiathèque" phone="0405060708" kind="place" {...LABELS} testID="l2" />)
    expect(screen.queryByTestId('l2-call')).toBeNull()
  })
})

describe('CallableContact — champs facultatifs', () => {
  it('se rend sans rôle ni note, sans laisser de trou dans la mise en page', () => {
    render(<CallableContact name="Julien" phone="0102030405" {...LABELS} testID="c5" />)
    expect(screen.getByText('Julien')).toBeTruthy()
    expect(screen.getByTestId('c5-call')).toBeTruthy()
  })

  it('ne propose pas le message quand le parent n\'en fournit pas le libellé', () => {
    render(<CallableContact name="Julien" phone="0102030405" callLabel="Appeler" accentColor="#9333EA" testID="c6" />)
    expect(screen.getByTestId('c6-call')).toBeTruthy()
    expect(screen.queryByTestId('c6-message')).toBeNull()
  })
})
