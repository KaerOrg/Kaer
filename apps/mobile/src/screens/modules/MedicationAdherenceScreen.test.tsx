import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import MedicationAdherenceScreen from './MedicationAdherenceScreen'

jest.mock('@react-navigation/native', () => {
  const React = require('react')
  return {
    useFocusEffect: (cb: () => void) => {
      React.useEffect(() => { cb() }, [])
    },
  }
})

jest.mock('../../lib/database', () => ({
  getMedicationAdherenceEntry: jest.fn().mockResolvedValue(null),
  getAllMedicationAdherenceEntries: jest.fn().mockResolvedValue([]),
  saveMedicationAdherenceEntry: jest.fn().mockResolvedValue(undefined),
  deleteMedicationAdherenceEntry: jest.fn().mockResolvedValue(undefined),
  generateId: jest.fn().mockReturnValue('test-id-999'),
}))

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnValue({
      insert: jest.fn().mockResolvedValue({ error: null }),
    }),
  },
}))

jest.mock('../../store/authStore', () => ({
  useAuthStore: jest.fn().mockImplementation((selector) =>
    selector({ patient: { id: 'patient-uuid-1' } })
  ),
}))

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}))

jest.mock('../../hooks/useTeen', () => ({
  useTeen: () => ({ isTeenMode: false, tt: () => '', tg: () => '', teenColor: () => undefined }),
}))

const { getMedicationAdherenceEntry, getAllMedicationAdherenceEntries, saveMedicationAdherenceEntry } =
  jest.requireMock('../../lib/database')

describe('MedicationAdherenceScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    getMedicationAdherenceEntry.mockResolvedValue(null)
    getAllMedicationAdherenceEntries.mockResolvedValue([])
  })

  it('affiche les 3 boutons de statut sur l\'onglet Aujourd\'hui', async () => {
    render(<MedicationAdherenceScreen />)
    expect(await screen.findByText('Pris')).toBeTruthy()
    expect(screen.getByText('Partiellement')).toBeTruthy()
    expect(screen.getByText('Non pris')).toBeTruthy()
  })

  it('affiche le bouton "Enregistrer" quand aucune entrée du jour n\'existe', async () => {
    render(<MedicationAdherenceScreen />)
    expect(await screen.findByText('Enregistrer')).toBeTruthy()
  })

  it('affiche "Mettre à jour" quand une entrée du jour existe déjà', async () => {
    getMedicationAdherenceEntry.mockResolvedValue({
      id: 'existing-id',
      date: new Date().toISOString().slice(0, 10),
      status: 'taken',
      notes: null,
      created_at: new Date().toISOString(),
    })
    render(<MedicationAdherenceScreen />)
    expect(await screen.findByText('Mettre à jour')).toBeTruthy()
  })

  it('pré-remplit les notes si une entrée du jour existe', async () => {
    getMedicationAdherenceEntry.mockResolvedValue({
      id: 'existing-id',
      date: new Date().toISOString().slice(0, 10),
      status: 'partial',
      notes: 'oubli le matin',
      created_at: new Date().toISOString(),
    })
    render(<MedicationAdherenceScreen />)
    expect(await screen.findByDisplayValue('oubli le matin')).toBeTruthy()
  })

  it('affiche l\'historique sur l\'onglet Historique', async () => {
    getAllMedicationAdherenceEntries.mockResolvedValue([
      { id: 'h1', date: '2026-04-13', status: 'taken', notes: null, created_at: '2026-04-13T10:00:00' },
      { id: 'h2', date: '2026-04-12', status: 'missed', notes: 'oubli', created_at: '2026-04-12T10:00:00' },
    ])
    render(<MedicationAdherenceScreen />)
    await screen.findByText('Enregistrer')
    fireEvent.press(screen.getByText('Historique'))
    const prisElements = await screen.findAllByText('Pris')
    expect(prisElements.length).toBeGreaterThanOrEqual(1)
    const nonPrisElements = await screen.findAllByText('Non pris')
    expect(nonPrisElements.length).toBeGreaterThanOrEqual(1)
  })

  it('affiche "Aucune saisie" sur l\'onglet Historique quand vide', async () => {
    render(<MedicationAdherenceScreen />)
    await screen.findByText('Enregistrer')
    fireEvent.press(screen.getByText('Historique'))
    expect(await screen.findByText(/Aucune saisie/i)).toBeTruthy()
  })

  it('appelle saveMedicationAdherenceEntry avec le statut sélectionné', async () => {
    render(<MedicationAdherenceScreen />)
    fireEvent.press(await screen.findByText('Pris'))
    fireEvent.press(screen.getByText('Enregistrer'))
    await waitFor(() => {
      expect(saveMedicationAdherenceEntry).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'taken' })
      )
    })
  })

  it('ne sauvegarde pas si aucun statut n\'est sélectionné', async () => {
    render(<MedicationAdherenceScreen />)
    fireEvent.press(await screen.findByText('Enregistrer'))
    await waitFor(() => {
      expect(saveMedicationAdherenceEntry).not.toHaveBeenCalled()
    })
  })

  it('affiche l\'onglet Historique', async () => {
    render(<MedicationAdherenceScreen />)
    expect(await screen.findByText('Historique')).toBeTruthy()
  })
})
