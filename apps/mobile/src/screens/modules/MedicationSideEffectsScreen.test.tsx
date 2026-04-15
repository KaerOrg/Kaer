import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import MedicationSideEffectsScreen from './MedicationSideEffectsScreen'

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('@react-navigation/native', () => {
  const React = require('react')
  return {
    useFocusEffect: (cb: () => () => void) => {
      React.useEffect(() => { cb() }, [])
    },
  }
})

jest.mock('../../lib/database', () => ({
  getSideEffectsEntry: jest.fn().mockResolvedValue(null),
  getAllSideEffectsEntries: jest.fn().mockResolvedValue([]),
  saveSideEffectsEntry: jest.fn().mockResolvedValue(undefined),
  generateId: jest.fn().mockReturnValue('test-se-id'),
}))

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnValue({
      insert: jest.fn().mockResolvedValue({ error: null }),
    }),
  },
}))

jest.mock('../../store/authStore', () => ({
  useAuthStore: jest.fn().mockImplementation(
    (selector: (s: { patient: { id: string } | null }) => unknown) =>
      selector({ patient: { id: 'patient-uuid-1' } })
  ),
}))

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}))

// ─── Helpers ──────────────────────────────────────────────────────────────────

const {
  getSideEffectsEntry,
  getAllSideEffectsEntries,
  saveSideEffectsEntry,
} = jest.requireMock('../../lib/database')

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('MedicationSideEffectsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    getSideEffectsEntry.mockResolvedValue(null)
    getAllSideEffectsEntries.mockResolvedValue([])
  })

  it('affiche les 6 effets secondaires', async () => {
    render(<MedicationSideEffectsScreen />)
    expect(await screen.findByText('Sédation')).toBeTruthy()
    expect(screen.getByText('Akathisie')).toBeTruthy()
    expect(screen.getByText('Tremblements')).toBeTruthy()
    expect(screen.getByText('Sécheresse buccale')).toBeTruthy()
    expect(screen.getByText('Troubles du sommeil')).toBeTruthy()
    expect(screen.getByText('Nausées / troubles digestifs')).toBeTruthy()
  })

  it('affiche l\'échelle 0–3 pour chaque effet', async () => {
    render(<MedicationSideEffectsScreen />)
    // Chaque bouton "Absent" correspond à 0 — il doit y en avoir 6
    const absentButtons = await screen.findAllByText('Absent')
    expect(absentButtons.length).toBe(6)
  })

  it('affiche le rappel de l\'échelle', async () => {
    render(<MedicationSideEffectsScreen />)
    expect(await screen.findByText(/0 = Absent/i)).toBeTruthy()
  })

  it('affiche "Enregistrer" quand aucune entrée du jour n\'existe', async () => {
    render(<MedicationSideEffectsScreen />)
    expect(await screen.findByText('Enregistrer')).toBeTruthy()
  })

  it('affiche "Mettre à jour" quand une entrée existe déjà', async () => {
    getSideEffectsEntry.mockResolvedValue({
      id: 'existing-se',
      date: new Date().toISOString().slice(0, 10),
      sedation: 1,
      akathisia: 0,
      tremors: 0,
      dry_mouth: 0,
      sleep_disturbance: 2,
      nausea: 0,
      notes: null,
      created_at: new Date().toISOString(),
    })
    render(<MedicationSideEffectsScreen />)
    expect(await screen.findByText('Mettre à jour')).toBeTruthy()
  })

  it('appelle saveSideEffectsEntry au tap sur Enregistrer', async () => {
    render(<MedicationSideEffectsScreen />)
    fireEvent.press(await screen.findByText('Enregistrer'))
    await waitFor(() => {
      expect(saveSideEffectsEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          sedation: 0,
          akathisia: 0,
          tremors: 0,
          dry_mouth: 0,
          sleep_disturbance: 0,
          nausea: 0,
        })
      )
    })
  })

  it('met à jour la valeur d\'un effet quand on tape sur un bouton de l\'échelle', async () => {
    render(<MedicationSideEffectsScreen />)
    // Les boutons "Léger" — un par effet, on tape le premier
    const legerButtons = await screen.findAllByText('Léger')
    fireEvent.press(legerButtons[0])
    fireEvent.press(screen.getByText('Enregistrer'))
    await waitFor(() => {
      expect(saveSideEffectsEntry).toHaveBeenCalledWith(
        expect.objectContaining({ sedation: 1 })
      )
    })
  })

  it('affiche la section historique', async () => {
    render(<MedicationSideEffectsScreen />)
    expect(await screen.findByText(/Historique/i)).toBeTruthy()
  })

  it('affiche "Aucune saisie" quand l\'historique est vide', async () => {
    render(<MedicationSideEffectsScreen />)
    expect(await screen.findByText(/Aucune saisie/i)).toBeTruthy()
  })

  it('affiche les entrées de l\'historique', async () => {
    getAllSideEffectsEntries.mockResolvedValue([
      {
        id: 'h1',
        date: '2026-04-13',
        sedation: 2,
        akathisia: 0,
        tremors: 1,
        dry_mouth: 0,
        sleep_disturbance: 0,
        nausea: 0,
        notes: null,
        created_at: '2026-04-13T10:00:00',
      },
    ])
    render(<MedicationSideEffectsScreen />)
    // "Sédation 2" et "Tremblements 1" doivent apparaître dans l'historique
    expect(await screen.findByText(/Sédation 2/i)).toBeTruthy()
    expect(screen.getByText(/Tremblements 1/i)).toBeTruthy()
  })
})
