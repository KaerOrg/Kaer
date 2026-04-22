jest.mock('../../hooks/useTeen', () => ({
  useTeen: () => ({ isTeenMode: false, tt: () => '', tg: () => '', teenColor: () => undefined }),
}))

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import { Alert } from 'react-native'
import FearThermometerScreen from './FearThermometerScreen'
import * as database from '../../lib/database'

jest.setTimeout(15000)

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('@react-navigation/native', () => {
  const React = require('react')
  return {
    useNavigation: () => ({ navigate: jest.fn() }),
    useFocusEffect: (cb: () => void) => {
      React.useEffect(() => { cb() }, [])
    },
  }
})

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}))

jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons')

jest.mock('../../lib/database', () => ({
  getAllFearEntries: jest.fn().mockResolvedValue([]),
  getAllFearSituations: jest.fn().mockResolvedValue([]),
  saveFearSituation: jest.fn().mockResolvedValue(undefined),
  deleteFearSituation: jest.fn().mockResolvedValue(undefined),
  deleteFearEntry: jest.fn().mockResolvedValue(undefined),
  deserializeStrategies: jest.fn().mockReturnValue({ selected: [], custom: '' }),
  generateId: jest.fn().mockReturnValue('test-id-fear'),
}))

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const SITUATION: database.FearSituation = {
  id: 'sit-1',
  label: 'Prendre le métro',
  created_at: '2026-04-15T08:00:00',
}

const ENTRY: database.FearEntry = {
  id: 'entry-1',
  date: '2026-04-15',
  situation_id: 'sit-1',
  situation_label: 'Prendre le métro',
  suds_before: 70,
  strategies: '{"selected":["Respiration lente"],"custom":""}',
  custom_strategy: null,
  suds_after: 40,
  notes: 'Ça s\'est bien passé',
  created_at: '2026-04-15T09:00:00',
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('FearThermometerScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(database.getAllFearEntries as jest.Mock).mockResolvedValue([])
    ;(database.getAllFearSituations as jest.Mock).mockResolvedValue([])
    ;(database.deserializeStrategies as jest.Mock).mockReturnValue({ selected: [], custom: '' })
  })

  // ── Rendu initial ──────────────────────────────────────────────────────────

  it('affiche les deux onglets : Saisies et Mes situations', async () => {
    render(<FearThermometerScreen />)

    await waitFor(() => {
      expect(screen.getByText('Saisies')).toBeTruthy()
      expect(screen.getByText('Mes situations')).toBeTruthy()
    })
  })

  it('affiche l\'état vide et le bouton Nouvelle saisie quand aucune entrée', async () => {
    render(<FearThermometerScreen />)

    await waitFor(() => {
      expect(screen.getByTestId('new-entry-btn')).toBeTruthy()
      expect(screen.getByText('Aucune saisie')).toBeTruthy()
    })
  })

  it('affiche les saisies existantes avec situation et valeurs SUDs', async () => {
    ;(database.getAllFearEntries as jest.Mock).mockResolvedValue([ENTRY])
    ;(database.getAllFearSituations as jest.Mock).mockResolvedValue([SITUATION])
    ;(database.deserializeStrategies as jest.Mock).mockReturnValue({ selected: ['Respiration lente'], custom: '' })

    render(<FearThermometerScreen />)

    await waitFor(() => {
      expect(screen.getByText('Prendre le métro')).toBeTruthy()
      expect(screen.getByText('70')).toBeTruthy()
      expect(screen.getByText('40')).toBeTruthy()
    })
  })

  it('affiche les stratégies de la saisie comme badges', async () => {
    ;(database.getAllFearEntries as jest.Mock).mockResolvedValue([ENTRY])
    ;(database.deserializeStrategies as jest.Mock).mockReturnValue({ selected: ['Respiration lente'], custom: '' })

    render(<FearThermometerScreen />)

    await waitFor(() => {
      expect(screen.getByText('Respiration lente')).toBeTruthy()
    })
  })

  // ── Onglet Mes situations ──────────────────────────────────────────────────

  it('bascule vers l\'onglet Mes situations', async () => {
    render(<FearThermometerScreen />)

    await waitFor(() => expect(screen.getByText('Mes situations')).toBeTruthy())
    fireEvent.press(screen.getByText('Mes situations'))

    await waitFor(() => {
      expect(screen.getByTestId('new-situation-input')).toBeTruthy()
    })
  })

  it('ajoute une nouvelle situation via le champ texte', async () => {
    render(<FearThermometerScreen />)

    await waitFor(() => expect(screen.getByText('Mes situations')).toBeTruthy())
    fireEvent.press(screen.getByText('Mes situations'))

    await waitFor(() => expect(screen.getByTestId('new-situation-input')).toBeTruthy())

    fireEvent.changeText(screen.getByTestId('new-situation-input'), 'Supermarché')
    fireEvent.press(screen.getByTestId('add-situation-btn'))

    await waitFor(() => {
      expect(database.saveFearSituation).toHaveBeenCalledWith(
        expect.objectContaining({ label: 'Supermarché' })
      )
    })
  })

  it('ignore l\'ajout si le champ est vide', async () => {
    render(<FearThermometerScreen />)

    await waitFor(() => expect(screen.getByText('Mes situations')).toBeTruthy())
    fireEvent.press(screen.getByText('Mes situations'))

    await waitFor(() => expect(screen.getByTestId('add-situation-btn')).toBeTruthy())
    fireEvent.press(screen.getByTestId('add-situation-btn'))

    await waitFor(() => {
      expect(database.saveFearSituation).not.toHaveBeenCalled()
    })
  })

  it('affiche les situations du catalogue existant', async () => {
    ;(database.getAllFearSituations as jest.Mock).mockResolvedValue([SITUATION])

    render(<FearThermometerScreen />)

    await waitFor(() => expect(screen.getByText('Mes situations')).toBeTruthy())
    fireEvent.press(screen.getByText('Mes situations'))

    await waitFor(() => {
      expect(screen.getByText('Prendre le métro')).toBeTruthy()
    })
  })

  // ── Suppression d'entrée ───────────────────────────────────────────────────

  it('appelle deleteFearEntry après confirmation', async () => {
    ;(database.getAllFearEntries as jest.Mock).mockResolvedValue([ENTRY])
    ;(database.deserializeStrategies as jest.Mock).mockReturnValue({ selected: [], custom: '' })

    jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => {
      const destructive = (buttons as Array<{ style?: string; onPress?: () => void }>)
        .find((b) => b.style === 'destructive')
      destructive?.onPress?.()
    })

    render(<FearThermometerScreen />)

    await waitFor(() => {
      const deleteBtn = screen.getAllByLabelText('Supprimer')[0]
      expect(deleteBtn).toBeTruthy()
      fireEvent.press(deleteBtn)
    })

    await waitFor(() => {
      expect(database.deleteFearEntry).toHaveBeenCalledWith('entry-1')
    })
  })

  // ── Conformité MDR 2017/745 ────────────────────────────────────────────────

  it('n\'affiche aucun label interprétatif sur les valeurs SUDs (conformité MDR)', async () => {
    ;(database.getAllFearEntries as jest.Mock).mockResolvedValue([ENTRY])
    ;(database.deserializeStrategies as jest.Mock).mockReturnValue({ selected: [], custom: '' })

    render(<FearThermometerScreen />)

    await waitFor(() => expect(screen.getByText('Prendre le métro')).toBeTruthy())

    // Ces labels déclencheraient une requalification en Dispositif Médical
    expect(screen.queryByText(/panique/i)).toBeNull()
    expect(screen.queryByText(/sévère/i)).toBeNull()
    expect(screen.queryByText(/critique/i)).toBeNull()
    expect(screen.queryByText(/danger/i)).toBeNull()
    expect(screen.queryByText(/alerte/i)).toBeNull()
    expect(screen.queryByText(/normal/i)).toBeNull()
  })
})
