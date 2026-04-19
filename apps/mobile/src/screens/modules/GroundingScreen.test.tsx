jest.mock('../../hooks/useTeen', () => ({
  useTeen: () => ({ isTeenMode: false, tt: () => '', tg: () => '', teenColor: () => undefined }),
}))

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { Linking } from 'react-native'
import GroundingScreen from './GroundingScreen'

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}))

jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons')

jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined)

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('GroundingScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ── Mode intro ───────────────────────────────────────────────────────────────

  it('affiche la carte d\'introduction au démarrage', () => {
    render(<GroundingScreen />)
    expect(screen.getByTestId('intro-card')).toBeTruthy()
    expect(screen.getByText('Technique 5-4-3-2-1')).toBeTruthy()
  })

  it('affiche l\'aperçu des 5 étapes', () => {
    render(<GroundingScreen />)
    expect(screen.getByTestId('steps-preview')).toBeTruthy()
    expect(screen.getByText('Voir')).toBeTruthy()
    expect(screen.getByText('Toucher')).toBeTruthy()
    expect(screen.getByText('Entendre')).toBeTruthy()
    expect(screen.getByText('Sentir')).toBeTruthy()
    expect(screen.getByText('Goûter')).toBeTruthy()
  })

  it('affiche le bouton Commencer', () => {
    render(<GroundingScreen />)
    expect(screen.getByTestId('start-button')).toBeTruthy()
    expect(screen.getByText('Commencer l\'exercice')).toBeTruthy()
  })

  it('affiche la section urgences en mode intro', () => {
    render(<GroundingScreen />)
    expect(screen.getByTestId('safety-section')).toBeTruthy()
    expect(screen.getByText(/3114/)).toBeTruthy()
    expect(screen.getByText(/SAMU/i)).toBeTruthy()
  })

  // ── Transition intro → guidé ─────────────────────────────────────────────────

  it('passe en mode guidé après avoir appuyé sur Commencer', () => {
    render(<GroundingScreen />)
    fireEvent.press(screen.getByTestId('start-button'))
    expect(screen.getByTestId('guided-mode')).toBeTruthy()
  })

  // ── Mode guidé — étape 1 (Voir) ───────────────────────────────────────────────

  it('affiche la première étape correctement', () => {
    render(<GroundingScreen />)
    fireEvent.press(screen.getByTestId('start-button'))
    expect(screen.getByTestId('step-card-0')).toBeTruthy()
    expect(screen.getByTestId('step-instruction-0')).toBeTruthy()
    expect(screen.getByText(/5 choses que vous voyez/)).toBeTruthy()
  })

  it('affiche la barre de progression', () => {
    render(<GroundingScreen />)
    fireEvent.press(screen.getByTestId('start-button'))
    expect(screen.getByTestId('progress-bar')).toBeTruthy()
    expect(screen.getByText('Étape 1 sur 5')).toBeTruthy()
  })

  it('affiche le bouton Étape suivante à la première étape', () => {
    render(<GroundingScreen />)
    fireEvent.press(screen.getByTestId('start-button'))
    expect(screen.getByText('Étape suivante')).toBeTruthy()
  })

  // ── Navigation entre étapes ───────────────────────────────────────────────────

  it('passe à l\'étape 2 (Toucher) après avoir appuyé sur Étape suivante', () => {
    render(<GroundingScreen />)
    fireEvent.press(screen.getByTestId('start-button'))
    fireEvent.press(screen.getByTestId('next-button'))
    expect(screen.getByTestId('step-card-1')).toBeTruthy()
    expect(screen.getByText('Étape 2 sur 5')).toBeTruthy()
    expect(screen.getByText(/4 textures/)).toBeTruthy()
  })

  it('parcourt toutes les étapes dans l\'ordre', () => {
    render(<GroundingScreen />)
    fireEvent.press(screen.getByTestId('start-button'))

    // Étape 1 → Voir
    expect(screen.getByText(/5 choses que vous voyez/)).toBeTruthy()
    fireEvent.press(screen.getByTestId('next-button'))

    // Étape 2 → Toucher
    expect(screen.getByText(/4 textures/)).toBeTruthy()
    fireEvent.press(screen.getByTestId('next-button'))

    // Étape 3 → Entendre
    expect(screen.getByText(/3 sons/)).toBeTruthy()
    fireEvent.press(screen.getByTestId('next-button'))

    // Étape 4 → Sentir
    expect(screen.getByText(/2 odeurs/)).toBeTruthy()
    fireEvent.press(screen.getByTestId('next-button'))

    // Étape 5 → Goûter
    expect(screen.getByText(/1 goût/)).toBeTruthy()
  })

  it('affiche "Terminer" à la dernière étape', () => {
    render(<GroundingScreen />)
    fireEvent.press(screen.getByTestId('start-button'))
    // Avancer jusqu'à la dernière étape
    for (let i = 0; i < 4; i++) {
      fireEvent.press(screen.getByTestId('next-button'))
    }
    expect(screen.getByText('Terminer')).toBeTruthy()
  })

  // ── Mode terminé ──────────────────────────────────────────────────────────────

  it('affiche la carte de fin après avoir terminé toutes les étapes', () => {
    render(<GroundingScreen />)
    fireEvent.press(screen.getByTestId('start-button'))
    for (let i = 0; i < 5; i++) {
      fireEvent.press(screen.getByTestId('next-button'))
    }
    expect(screen.getByTestId('done-card')).toBeTruthy()
    expect(screen.getByText('Exercice terminé')).toBeTruthy()
  })

  it('affiche la section urgences en mode terminé', () => {
    render(<GroundingScreen />)
    fireEvent.press(screen.getByTestId('start-button'))
    for (let i = 0; i < 5; i++) {
      fireEvent.press(screen.getByTestId('next-button'))
    }
    expect(screen.getByTestId('safety-section')).toBeTruthy()
  })

  it('revient en mode intro après Recommencer', () => {
    render(<GroundingScreen />)
    fireEvent.press(screen.getByTestId('start-button'))
    for (let i = 0; i < 5; i++) {
      fireEvent.press(screen.getByTestId('next-button'))
    }
    fireEvent.press(screen.getByTestId('restart-button'))
    expect(screen.getByTestId('intro-card')).toBeTruthy()
  })

  // ── Arrêt en cours d\'exercice ────────────────────────────────────────────────

  it('revient en mode intro après avoir appuyé sur Arrêter', () => {
    render(<GroundingScreen />)
    fireEvent.press(screen.getByTestId('start-button'))
    fireEvent.press(screen.getByLabelText('Arrêter l\'exercice'))
    expect(screen.getByTestId('intro-card')).toBeTruthy()
  })

  // ── Numéros d\'urgence ─────────────────────────────────────────────────────────

  it('appelle le 3114 quand on appuie sur le bouton urgence', () => {
    render(<GroundingScreen />)
    fireEvent.press(screen.getByLabelText('Appeler le 3114, numéro national de prévention du suicide'))
    expect(Linking.openURL).toHaveBeenCalledWith('tel:3114')
  })

  it('appelle le 15 quand on appuie sur SAMU', () => {
    render(<GroundingScreen />)
    fireEvent.press(screen.getByLabelText('Appeler le SAMU, le 15'))
    expect(Linking.openURL).toHaveBeenCalledWith('tel:15')
  })
})
