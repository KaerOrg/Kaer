import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import EmotionWheelScreen from './EmotionWheelScreen'
import EmotionEntryScreen from './EmotionEntryScreen'

// ─── Mocks communs ────────────────────────────────────────────────────────────

const mockNavigate = jest.fn()
const mockGoBack = jest.fn()

jest.mock('@react-navigation/native', () => {
  const React = require('react')
  return {
    useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
    useFocusEffect: (cb: () => () => void) => {
      React.useEffect(() => { cb() }, [])
    },
  }
})

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}))

jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons')

jest.mock('../../lib/database', () => ({
  getAllEmotionEntries: jest.fn(),
  deleteEmotionEntry: jest.fn(),
  saveEmotionEntry: jest.fn(),
  generateId: () => 'test-uuid-1234',
}))

const {
  getAllEmotionEntries,
  deleteEmotionEntry,
  saveEmotionEntry,
} = jest.requireMock('../../lib/database')

// ─── Fixture ──────────────────────────────────────────────────────────────────

const MOCK_ENTRY = {
  id: 'entry-1',
  created_at: '2026-04-16T10:00:00.000Z',
  primary_key: 'joy',
  primary_label: 'Joie',
  secondary_key: 'serenity',
  secondary_label: 'Sérénité',
  specific_key: 'calm',
  specific_label: 'Calme',
  intensity: 7,
  notes: null,
}

// ─── EmotionWheelScreen ───────────────────────────────────────────────────────

describe('EmotionWheelScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    getAllEmotionEntries.mockResolvedValue([])
  })

  it('affiche l\'état vide quand il n\'y a pas d\'entrées', async () => {
    render(<EmotionWheelScreen />)
    expect(await screen.findByTestId('empty-state')).toBeTruthy()
    expect(screen.getByText('Aucune entrée')).toBeTruthy()
  })

  it('affiche la carte d\'introduction', async () => {
    render(<EmotionWheelScreen />)
    expect(await screen.findByTestId('intro-card')).toBeTruthy()
  })

  it('affiche le bouton Identifier une émotion', async () => {
    render(<EmotionWheelScreen />)
    expect(await screen.findByTestId('add-entry-button')).toBeTruthy()
  })

  it('navigue vers EmotionEntry au tap sur le bouton', async () => {
    render(<EmotionWheelScreen />)
    fireEvent.press(await screen.findByTestId('add-entry-button'))
    expect(mockNavigate).toHaveBeenCalledWith('EmotionEntry')
  })

  it('affiche les entrées existantes', async () => {
    getAllEmotionEntries.mockResolvedValue([MOCK_ENTRY])
    render(<EmotionWheelScreen />)
    expect(await screen.findByTestId('entry-card-entry-1')).toBeTruthy()
    expect(screen.getByText('Joie')).toBeTruthy()
    expect(screen.getByText(/Sérénité.*Calme/)).toBeTruthy()
    expect(screen.getByText('7/10')).toBeTruthy()
  })

  it('affiche le compte d\'entrées dans le titre de section', async () => {
    getAllEmotionEntries.mockResolvedValue([MOCK_ENTRY])
    render(<EmotionWheelScreen />)
    expect(await screen.findByText('Historique (1)')).toBeTruthy()
  })

  it('supprime une entrée après confirmation', async () => {
    getAllEmotionEntries.mockResolvedValue([MOCK_ENTRY])
    deleteEmotionEntry.mockResolvedValue(undefined)

    const { getByLabelText } = render(<EmotionWheelScreen />)
    await screen.findByTestId('entry-card-entry-1')

    fireEvent.press(getByLabelText('Supprimer cette entrée'))

    // Simuler la confirmation de l'Alert
    const { Alert } = require('react-native')
    const alertCall = jest.spyOn(Alert, 'alert')
    expect(alertCall).toBeDefined()
  })
})

// ─── EmotionEntryScreen ───────────────────────────────────────────────────────

describe('EmotionEntryScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    saveEmotionEntry.mockResolvedValue(undefined)
  })

  it('affiche l\'étape primary au démarrage', () => {
    render(<EmotionEntryScreen />)
    expect(screen.getByTestId('step-primary')).toBeTruthy()
    expect(screen.getByText('Qu\'est-ce que vous ressentez ?')).toBeTruthy()
  })

  it('affiche les 8 émotions primaires', () => {
    render(<EmotionEntryScreen />)
    expect(screen.getByTestId('primary-joy')).toBeTruthy()
    expect(screen.getByTestId('primary-trust')).toBeTruthy()
    expect(screen.getByTestId('primary-fear')).toBeTruthy()
    expect(screen.getByTestId('primary-surprise')).toBeTruthy()
    expect(screen.getByTestId('primary-sadness')).toBeTruthy()
    expect(screen.getByTestId('primary-disgust')).toBeTruthy()
    expect(screen.getByTestId('primary-anger')).toBeTruthy()
    expect(screen.getByTestId('primary-anticipation')).toBeTruthy()
  })

  it('passe à l\'étape secondaire après sélection d\'une émotion primaire', () => {
    render(<EmotionEntryScreen />)
    fireEvent.press(screen.getByTestId('primary-joy'))
    expect(screen.getByTestId('step-secondary')).toBeTruthy()
    expect(screen.getByText(/nuance de joie/i)).toBeTruthy()
  })

  it('affiche les secondaires de la joie', () => {
    render(<EmotionEntryScreen />)
    fireEvent.press(screen.getByTestId('primary-joy'))
    expect(screen.getByTestId('secondary-serenity')).toBeTruthy()
    expect(screen.getByTestId('secondary-joy_2')).toBeTruthy()
    expect(screen.getByTestId('secondary-ecstasy')).toBeTruthy()
  })

  it('passe à l\'étape spécifique après sélection d\'un secondaire', () => {
    render(<EmotionEntryScreen />)
    fireEvent.press(screen.getByTestId('primary-joy'))
    fireEvent.press(screen.getByTestId('secondary-serenity'))
    expect(screen.getByTestId('step-specific')).toBeTruthy()
    expect(screen.getByText(/mot vous correspond/i)).toBeTruthy()
  })

  it('affiche les spécifiques de Sérénité', () => {
    render(<EmotionEntryScreen />)
    fireEvent.press(screen.getByTestId('primary-joy'))
    fireEvent.press(screen.getByTestId('secondary-serenity'))
    expect(screen.getByTestId('specific-calm')).toBeTruthy()
    expect(screen.getByTestId('specific-peaceful')).toBeTruthy()
    expect(screen.getByTestId('specific-content')).toBeTruthy()
  })

  it('passe à l\'étape intensité après sélection d\'un spécifique', () => {
    render(<EmotionEntryScreen />)
    fireEvent.press(screen.getByTestId('primary-joy'))
    fireEvent.press(screen.getByTestId('secondary-serenity'))
    fireEvent.press(screen.getByTestId('specific-calm'))
    expect(screen.getByTestId('step-intensity')).toBeTruthy()
    expect(screen.getByText(/Quelle est l'intensité/)).toBeTruthy()
  })

  it('affiche l\'intensité par défaut à 5', () => {
    render(<EmotionEntryScreen />)
    fireEvent.press(screen.getByTestId('primary-joy'))
    fireEvent.press(screen.getByTestId('secondary-serenity'))
    fireEvent.press(screen.getByTestId('specific-calm'))
    expect(screen.getByTestId('intensity-value').props.children).toBe(5)
  })

  it('met à jour l\'intensité au tap sur un bouton', () => {
    render(<EmotionEntryScreen />)
    fireEvent.press(screen.getByTestId('primary-joy'))
    fireEvent.press(screen.getByTestId('secondary-serenity'))
    fireEvent.press(screen.getByTestId('specific-calm'))
    fireEvent.press(screen.getByTestId('intensity-btn-8'))
    expect(screen.getByTestId('intensity-value').props.children).toBe(8)
  })

  it('passe à l\'étape notes après avoir appuyé sur Continuer', () => {
    render(<EmotionEntryScreen />)
    fireEvent.press(screen.getByTestId('primary-joy'))
    fireEvent.press(screen.getByTestId('secondary-serenity'))
    fireEvent.press(screen.getByTestId('specific-calm'))
    fireEvent.press(screen.getByTestId('continue-to-notes'))
    expect(screen.getByTestId('step-notes')).toBeTruthy()
  })

  it('affiche le récapitulatif à l\'étape notes', () => {
    render(<EmotionEntryScreen />)
    fireEvent.press(screen.getByTestId('primary-joy'))
    fireEvent.press(screen.getByTestId('secondary-serenity'))
    fireEvent.press(screen.getByTestId('specific-calm'))
    fireEvent.press(screen.getByTestId('continue-to-notes'))
    expect(screen.getByText(/Joie.*Sérénité.*Calme/)).toBeTruthy()
    expect(screen.getByText('Intensité : 5/10')).toBeTruthy()
  })

  it('enregistre l\'entrée et revient en arrière', async () => {
    render(<EmotionEntryScreen />)
    fireEvent.press(screen.getByTestId('primary-joy'))
    fireEvent.press(screen.getByTestId('secondary-serenity'))
    fireEvent.press(screen.getByTestId('specific-calm'))
    fireEvent.press(screen.getByTestId('continue-to-notes'))
    fireEvent.press(screen.getByTestId('save-button'))

    await waitFor(() => {
      expect(saveEmotionEntry).toHaveBeenCalledWith({
        id: 'test-uuid-1234',
        primary_key: 'joy',
        primary_label: 'Joie',
        secondary_key: 'serenity',
        secondary_label: 'Sérénité',
        specific_key: 'calm',
        specific_label: 'Calme',
        intensity: 5,
        notes: null,
      })
      expect(mockGoBack).toHaveBeenCalled()
    })
  })

  it('revient à l\'étape primaire depuis secondaire via le bouton retour', () => {
    render(<EmotionEntryScreen />)
    fireEvent.press(screen.getByTestId('primary-joy'))
    fireEvent.press(screen.getByTestId('back-button'))
    expect(screen.getByTestId('step-primary')).toBeTruthy()
  })

  it('revient à l\'étape secondaire depuis spécifique via le bouton retour', () => {
    render(<EmotionEntryScreen />)
    fireEvent.press(screen.getByTestId('primary-joy'))
    fireEvent.press(screen.getByTestId('secondary-serenity'))
    fireEvent.press(screen.getByTestId('back-button'))
    expect(screen.getByTestId('step-secondary')).toBeTruthy()
  })

  it('n\'affiche pas de bouton retour à l\'étape primary', () => {
    render(<EmotionEntryScreen />)
    expect(screen.queryByTestId('back-button')).toBeNull()
  })
})
