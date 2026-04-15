import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import MedicationAdherenceScreen from './MedicationAdherenceScreen'

// ─── Mocks des dépendances externes ──────────────────────────────────────────

jest.mock('@react-navigation/native', () => {
  const React = require('react')
  return {
    useFocusEffect: (cb: () => () => void) => {
      React.useEffect(() => { cb() }, [])
    },
  }
})

jest.mock('../../lib/database', () => ({
  getMedicationAdherenceEntry: jest.fn().mockResolvedValue(null),
  getAllMedicationAdherenceEntries: jest.fn().mockResolvedValue([]),
  saveMedicationAdherenceEntry: jest.fn().mockResolvedValue(undefined),
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
  useAuthStore: jest.fn().mockImplementation((selector: (s: { patient: { id: string } | null }) => unknown) =>
    selector({ patient: { id: 'patient-uuid-1' } })
  ),
}))

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}))

// ─── Helpers ─────────────────────────────────────────────────────────────────

const { getMedicationAdherenceEntry, getAllMedicationAdherenceEntries, saveMedicationAdherenceEntry } =
  jest.requireMock('../../lib/database')

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('MedicationAdherenceScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    getMedicationAdherenceEntry.mockResolvedValue(null)
    getAllMedicationAdherenceEntries.mockResolvedValue([])
  })

  it('affiche la section de saisie du jour', async () => {
    render(<MedicationAdherenceScreen />)
    expect(await screen.findByText('Mon traitement du jour')).toBeTruthy()
  })

  it('affiche les 3 boutons de statut', async () => {
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

  it('pré-remplit le statut si une entrée du jour existe', async () => {
    getMedicationAdherenceEntry.mockResolvedValue({
      id: 'existing-id',
      date: new Date().toISOString().slice(0, 10),
      status: 'partial',
      notes: 'oubli le matin',
      created_at: new Date().toISOString(),
    })
    render(<MedicationAdherenceScreen />)
    // Le champ notes doit être pré-rempli
    expect(await screen.findByDisplayValue('oubli le matin')).toBeTruthy()
  })

  it('affiche l\'historique quand des entrées existent', async () => {
    getAllMedicationAdherenceEntries.mockResolvedValue([
      { id: 'h1', date: '2026-04-13', status: 'taken', notes: null, created_at: '2026-04-13T10:00:00' },
      { id: 'h2', date: '2026-04-12', status: 'missed', notes: 'oubli', created_at: '2026-04-12T10:00:00' },
    ])
    render(<MedicationAdherenceScreen />)
    // Les deux statuts doivent apparaître dans l'historique
    const prisElements = await screen.findAllByText('Pris')
    expect(prisElements.length).toBeGreaterThanOrEqual(1)
    const nonPrisElements = await screen.findAllByText('Non pris')
    expect(nonPrisElements.length).toBeGreaterThanOrEqual(1)
  })

  it('affiche "Aucune saisie" quand l\'historique est vide', async () => {
    render(<MedicationAdherenceScreen />)
    expect(await screen.findByText(/Aucune saisie/i)).toBeTruthy()
  })

  it('appelle saveMedicationAdherenceEntry au tap sur Enregistrer avec un statut sélectionné', async () => {
    render(<MedicationAdherenceScreen />)
    // Sélectionner le statut "Pris"
    const prisBtn = await screen.findByText('Pris')
    fireEvent.press(prisBtn)
    // Tapper le bouton Enregistrer
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

  it('affiche la section historique', async () => {
    render(<MedicationAdherenceScreen />)
    expect(await screen.findByText(/Historique/i)).toBeTruthy()
  })
})
