import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import { Alert } from 'react-native'
import MoodTrackerScreen from './MoodTrackerScreen'
import * as database from '../../lib/database'
import * as supabaseLib from '../../lib/supabase'
import * as authStore from '../../store/authStore'

jest.setTimeout(15000)

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('@react-navigation/native', () => {
  const React = require('react')
  return {
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
  getAllMoodEntries: jest.fn().mockResolvedValue([]),
  getMoodEntryForDate: jest.fn().mockResolvedValue(null),
  saveMoodEntry: jest.fn().mockResolvedValue(undefined),
  deleteMoodEntry: jest.fn().mockResolvedValue(undefined),
  generateId: jest.fn().mockReturnValue('test-id-mood'),
}))

jest.mock('../../lib/supabase', () => ({
  supabase: { from: jest.fn().mockReturnValue({ insert: jest.fn().mockResolvedValue({}) }) },
}))

jest.mock('../../store/authStore', () => ({
  useAuthStore: jest.fn().mockReturnValue(null),
}))

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().slice(0, 10)

const ENTRY_TODAY: database.MoodEntry = {
  id: 'entry-today',
  date: TODAY,
  mood: 7,
  energy: 6,
  anxiety: 3,
  pleasure: 8,
  notes: 'Bonne journée',
  created_at: TODAY + 'T10:00:00',
}

const ENTRY_PAST: database.MoodEntry = {
  id: 'entry-past',
  date: '2026-04-13',
  mood: 5,
  energy: 4,
  anxiety: 6,
  pleasure: 3,
  notes: null,
  created_at: '2026-04-13T20:00:00',
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('MoodTrackerScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(database.getAllMoodEntries as jest.Mock).mockResolvedValue([])
    ;(database.getMoodEntryForDate as jest.Mock).mockResolvedValue(null)
  })

  // ── Rendu initial ──────────────────────────────────────────────────────────

  it('affiche les 4 dimensions : Humeur, Énergie, Anxiété, Plaisir', async () => {
    render(<MoodTrackerScreen />)

    await waitFor(() => {
      expect(screen.getByText('Humeur')).toBeTruthy()
      expect(screen.getByText('Énergie')).toBeTruthy()
      expect(screen.getByText('Anxiété')).toBeTruthy()
      expect(screen.getByText('Plaisir')).toBeTruthy()
    })
  })

  it('affiche le bouton Enregistrer sur l\'onglet Aujourd\'hui', async () => {
    render(<MoodTrackerScreen />)

    await waitFor(() => {
      expect(screen.getByTestId('save-button')).toBeTruthy()
    })
  })

  it('affiche la valeur par défaut 5 pour chaque dimension', async () => {
    render(<MoodTrackerScreen />)

    await waitFor(() => {
      // 3 dimensions × valeur 5 affichée dans le header de chaque ScalePicker
      const fives = screen.getAllByText('5')
      expect(fives.length).toBeGreaterThanOrEqual(3)
    })
  })

  // ── Chargement d'une saisie existante ──────────────────────────────────────

  it('pré-remplit le formulaire si une saisie existe déjà pour aujourd\'hui', async () => {
    ;(database.getMoodEntryForDate as jest.Mock).mockResolvedValue(ENTRY_TODAY)
    ;(database.getAllMoodEntries as jest.Mock).mockResolvedValue([ENTRY_TODAY])

    render(<MoodTrackerScreen />)

    await waitFor(() => {
      expect(screen.getByTestId('already-saved-banner')).toBeTruthy()
    })
  })

  it('affiche "Mettre à jour" quand une saisie du jour existe déjà', async () => {
    ;(database.getMoodEntryForDate as jest.Mock).mockResolvedValue(ENTRY_TODAY)
    ;(database.getAllMoodEntries as jest.Mock).mockResolvedValue([ENTRY_TODAY])

    render(<MoodTrackerScreen />)

    await waitFor(() => {
      expect(screen.getByText('Mettre à jour')).toBeTruthy()
    })
  })

  // ── Sauvegarde ─────────────────────────────────────────────────────────────

  it('appelle saveMoodEntry en appuyant sur Enregistrer', async () => {
    ;(database.getAllMoodEntries as jest.Mock).mockResolvedValue([])
    jest.spyOn(Alert, 'alert').mockImplementation(() => {})

    render(<MoodTrackerScreen />)

    await waitFor(() => expect(screen.getByTestId('save-button')).toBeTruthy())

    fireEvent.press(screen.getByTestId('save-button'))

    await waitFor(() => {
      expect(database.saveMoodEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'test-id-mood',
          date: TODAY,
          mood: 5,
          energy: 5,
          anxiety: 5,
          pleasure: 5,
        })
      )
    })
  })

  it('affiche une alerte de confirmation après sauvegarde réussie', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {})
    ;(database.getAllMoodEntries as jest.Mock).mockResolvedValue([])

    render(<MoodTrackerScreen />)

    await waitFor(() => expect(screen.getByTestId('save-button')).toBeTruthy())
    fireEvent.press(screen.getByTestId('save-button'))

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Enregistré', expect.any(String))
    })
  })

  // ── Onglet Historique ──────────────────────────────────────────────────────

  it('passe à l\'onglet Historique en appuyant dessus', async () => {
    render(<MoodTrackerScreen />)

    await waitFor(() => expect(screen.getByText('Historique')).toBeTruthy())
    fireEvent.press(screen.getByText('Historique'))

    await waitFor(() => {
      // Le bouton Enregistrer disparaît côté historique
      expect(screen.queryByTestId('save-button')).toBeNull()
    })
  })

  it('affiche le message vide si moins de 2 saisies', async () => {
    ;(database.getAllMoodEntries as jest.Mock).mockResolvedValue([ENTRY_TODAY])

    render(<MoodTrackerScreen />)

    await waitFor(() => expect(screen.getByText('Historique')).toBeTruthy())
    fireEvent.press(screen.getByText('Historique'))

    await waitFor(() => {
      expect(screen.getByText(/L'historique s'affichera/)).toBeTruthy()
    })
  })

  it('affiche les entrées passées dans l\'historique', async () => {
    ;(database.getAllMoodEntries as jest.Mock).mockResolvedValue([ENTRY_TODAY, ENTRY_PAST])
    ;(database.getMoodEntryForDate as jest.Mock).mockResolvedValue(ENTRY_TODAY)

    render(<MoodTrackerScreen />)

    await waitFor(() => expect(screen.getByText('Historique')).toBeTruthy())
    fireEvent.press(screen.getByText('Historique'))

    await waitFor(() => {
      // Les 3 valeurs de l'entrée passée sont affichées
      expect(screen.getByText('5')).toBeTruthy() // mood
    })
  })

  // ── Suppression ────────────────────────────────────────────────────────────

  it('appelle deleteMoodEntry après confirmation de suppression', async () => {
    ;(database.getAllMoodEntries as jest.Mock).mockResolvedValue([ENTRY_TODAY, ENTRY_PAST])
    ;(database.getMoodEntryForDate as jest.Mock).mockResolvedValue(ENTRY_TODAY)

    jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => {
      const destructive = (buttons as Array<{ style?: string; onPress?: () => void }>)
        .find((b) => b.style === 'destructive')
      destructive?.onPress?.()
    })

    render(<MoodTrackerScreen />)

    await waitFor(() => expect(screen.getByText('Historique')).toBeTruthy())
    fireEvent.press(screen.getByText('Historique'))

    await waitFor(() => {
      const deleteBtn = screen.getAllByLabelText('Supprimer cette saisie')[0]
      expect(deleteBtn).toBeTruthy()
      fireEvent.press(deleteBtn)
    })

    await waitFor(() => {
      expect(database.deleteMoodEntry).toHaveBeenCalled()
    })
  })

  // ── Conformité MDR 2017/745 ────────────────────────────────────────────────

  it('n\'affiche aucun label interprétatif sur les valeurs (conformité MDR)', async () => {
    ;(database.getMoodEntryForDate as jest.Mock).mockResolvedValue(ENTRY_TODAY)
    ;(database.getAllMoodEntries as jest.Mock).mockResolvedValue([ENTRY_TODAY])

    render(<MoodTrackerScreen />)

    await waitFor(() => expect(screen.getByText('Humeur')).toBeTruthy())

    // Ces labels déclencheraient une requalification en Dispositif Médical
    expect(screen.queryByText(/déprimé/i)).toBeNull()
    expect(screen.queryByText(/maniaque/i)).toBeNull()
    expect(screen.queryByText(/normal/i)).toBeNull()
    expect(screen.queryByText(/critique/i)).toBeNull()
    expect(screen.queryByText(/sévère/i)).toBeNull()
    expect(screen.queryByText(/alert/i)).toBeNull()
  })
})
