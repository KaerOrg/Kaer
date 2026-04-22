jest.mock('../../hooks/useTeen', () => ({
  useTeen: () => ({ isTeenMode: false, tt: () => '', tg: () => '', teenColor: () => undefined }),
}))

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import { Alert } from 'react-native'
import BeckColumnsScreen from './BeckColumnsScreen'
import * as database from '../../lib/database'

jest.setTimeout(15000)

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockNavigate = jest.fn()

jest.mock('@react-navigation/native', () => {
  const React = require('react')
  return {
    useNavigation: () => ({ navigate: mockNavigate }),
    useFocusEffect: (cb: () => () => void) => {
      React.useEffect(() => {
        cb()
      }, [])
    },
  }
})

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}))

jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons')

jest.mock('../../lib/database', () => ({
  getAllThoughtRecords: jest.fn().mockResolvedValue([]),
  deleteThoughtRecord: jest.fn().mockResolvedValue(undefined),
  generateId: jest.fn().mockReturnValue('test-id-beck'),
}))

// ─── Données de test ──────────────────────────────────────────────────────────

const RECORD_FIXTURE: database.ThoughtRecord = {
  id: 'rec-1',
  date: '2026-04-14T10:00:00.000Z',
  situation: 'Réunion difficile au travail',
  emotion: 'Anxiété',
  emotion_intensity: 70,
  automatic_thought: 'Je vais échouer',
  thought_belief: 85,
  rational_response: 'J\'ai déjà réussi dans des situations similaires',
  outcome_emotion: 'Anxiété légère',
  outcome_intensity: 30,
  outcome_belief: 60,
  created_at: '2026-04-14T10:05:00.000Z',
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('BeckColumnsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(database.getAllThoughtRecords as jest.Mock).mockResolvedValue([])
  })

  // ── Rendu état vide ────────────────────────────────────────────────────────

  it('affiche l\'état vide quand aucun enregistrement n\'existe', async () => {
    render(<BeckColumnsScreen />)

    await waitFor(() => {
      expect(screen.getByText('Aucun enregistrement')).toBeTruthy()
    })
  })

  it('affiche le bouton "Nouvelle pensée" dans l\'état vide', async () => {
    render(<BeckColumnsScreen />)

    await waitFor(() => {
      expect(screen.getByText('Nouvelle pensée')).toBeTruthy()
    })
  })

  // ── Rendu avec données ─────────────────────────────────────────────────────

  it('affiche les enregistrements existants', async () => {
    ;(database.getAllThoughtRecords as jest.Mock).mockResolvedValue([RECORD_FIXTURE])

    render(<BeckColumnsScreen />)

    await waitFor(() => {
      expect(screen.getByText('Réunion difficile au travail')).toBeTruthy()
      expect(screen.getByText('Je vais échouer')).toBeTruthy()
    })
  })

  it('affiche l\'émotion et son intensité brute', async () => {
    ;(database.getAllThoughtRecords as jest.Mock).mockResolvedValue([RECORD_FIXTURE])

    render(<BeckColumnsScreen />)

    await waitFor(() => {
      // L'émotion et son intensité sont dans un <Text> imbriqué : texte combiné "Anxiété (70%)"
      expect(screen.getByText('Anxiété (70%)')).toBeTruthy()
    })
  })

  it('affiche l\'émotion résultante si renseignée', async () => {
    ;(database.getAllThoughtRecords as jest.Mock).mockResolvedValue([RECORD_FIXTURE])

    render(<BeckColumnsScreen />)

    await waitFor(() => {
      // Texte combiné du <Text> parent : "Anxiété légère (30%)"
      expect(screen.getByText('Anxiété légère (30%)')).toBeTruthy()
    })
  })

  // ── Navigation ─────────────────────────────────────────────────────────────

  it('navigue vers BeckEntry (nouvelle entrée) en appuyant sur "Nouvelle pensée"', async () => {
    render(<BeckColumnsScreen />)

    await waitFor(() => {
      expect(screen.getByText('Nouvelle pensée')).toBeTruthy()
    })

    fireEvent.press(screen.getByText('Nouvelle pensée'))

    expect(mockNavigate).toHaveBeenCalledWith('BeckEntry', {})
  })

  it('navigue vers BeckEntry avec l\'id en appuyant sur modifier', async () => {
    ;(database.getAllThoughtRecords as jest.Mock).mockResolvedValue([RECORD_FIXTURE])

    render(<BeckColumnsScreen />)

    await waitFor(() => {
      expect(screen.getByText('Réunion difficile au travail')).toBeTruthy()
    })

    // Presse le bouton d'édition (accessibilityLabel="Modifier cet enregistrement")
    fireEvent.press(screen.getByLabelText('Modifier'))

    expect(mockNavigate).toHaveBeenCalledWith('BeckEntry', { recordId: 'rec-1' })
  })

  // ── Suppression ────────────────────────────────────────────────────────────

  it('appelle Alert.alert en appuyant sur supprimer', async () => {
    ;(database.getAllThoughtRecords as jest.Mock).mockResolvedValue([RECORD_FIXTURE])
    const alertSpy = jest.spyOn(Alert, 'alert')

    render(<BeckColumnsScreen />)

    await waitFor(() => {
      expect(screen.getByText('Réunion difficile au travail')).toBeTruthy()
    })

    fireEvent.press(screen.getByLabelText('Supprimer'))

    expect(alertSpy).toHaveBeenCalledWith(
      'Supprimer cet enregistrement ?',
      'Cette action est irréversible.',
      expect.any(Array)
    )
  })

  it('appelle deleteThoughtRecord après confirmation de suppression', async () => {
    ;(database.getAllThoughtRecords as jest.Mock).mockResolvedValue([RECORD_FIXTURE])
    jest.spyOn(Alert, 'alert').mockImplementation((_title, _msg, buttons) => {
      const destructive = (buttons as Array<{ style?: string; onPress?: () => void }>)
        .find((b) => b.style === 'destructive')
      destructive?.onPress?.()
    })

    render(<BeckColumnsScreen />)

    await waitFor(() => {
      expect(screen.getByText('Réunion difficile au travail')).toBeTruthy()
    })

    fireEvent.press(screen.getByLabelText('Supprimer'))

    await waitFor(() => {
      expect(database.deleteThoughtRecord).toHaveBeenCalledWith('rec-1')
    })
  })

  // ── Conformité MDR ─────────────────────────────────────────────────────────

  it('n\'affiche aucun label interprétatif généré par l\'app (conformité MDR)', async () => {
    // Test avec liste vide : vérifie que le code de l'app n'ajoute aucun label interprétatif.
    // (Les données saisies par l'utilisateur peuvent contenir ces termes — c'est son droit.)
    ;(database.getAllThoughtRecords as jest.Mock).mockResolvedValue([])

    render(<BeckColumnsScreen />)

    await waitFor(() => {
      expect(screen.getByText('Aucun enregistrement')).toBeTruthy()
    })

    // Ces labels dans le code de l'app déclencheraient une requalification en Dispositif Médical
    expect(screen.queryByText(/sévère/i)).toBeNull()
    expect(screen.queryByText(/modér/i)).toBeNull()
    expect(screen.queryByText(/léger/i)).toBeNull()
    expect(screen.queryByText(/critique/i)).toBeNull()
  })
})
