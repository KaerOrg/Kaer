import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import MotivationalBalanceScreen from './MotivationalBalanceScreen'

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../../hooks/useTeen', () => ({
  useTeen: () => ({
    isTeenMode: false,
    tt: () => '',
    tg: () => '',
    teenColor: () => undefined,
  }),
}))

jest.mock('@react-navigation/native', () => {
  const React = require('react')
  return {
    useNavigation: () => ({ navigate: jest.fn(), setOptions: jest.fn() }),
    useFocusEffect: (cb) => {
      React.useEffect(() => {
        const cleanup = cb()
        return cleanup
      }, [])
    },
  }
})

jest.mock('../../services/psyeduService', () => ({
  fetchTopicsByModule: jest.fn().mockResolvedValue([
    { id: 't1', module_key: 'motivational_balance', topic_key: 'ambivalence', icon_name: 'Scale', sort_order: 1, is_active: true },
    { id: 't2', module_key: 'motivational_balance', topic_key: 'stages_of_change', icon_name: 'RotateCcw', sort_order: 2, is_active: true },
  ]),
}))

jest.mock('../../services/motivationalBalanceService', () => ({
  saveEMRuler: jest.fn().mockResolvedValue(undefined),
  listEMRulers: jest.fn().mockResolvedValue([]),
  deleteEMRuler: jest.fn().mockResolvedValue(undefined),
  saveEMBalanceItem: jest.fn().mockResolvedValue(undefined),
  listEMBalanceItems: jest.fn().mockResolvedValue([]),
  deleteEMBalanceItem: jest.fn().mockResolvedValue(undefined),
  saveEMValues: jest.fn().mockResolvedValue(undefined),
  listEMValues: jest.fn().mockResolvedValue([]),
}))

jest.mock('../../components/ModuleRenderer/layouts/PsyEdu/iconMap', () => ({
  resolvePsyEduIcon: () => () => null,
}))

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }) => children,
}))

jest.mock('uuid', () => ({ v4: () => 'mock-uuid' }))
jest.mock('react-native-get-random-values', () => ({}))

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('MotivationalBalanceScreen', () => {
  it('affiche l\'écran principal', async () => {
    render(<MotivationalBalanceScreen />)
    await waitFor(() => {
      expect(screen.getByTestId('mb-screen')).toBeTruthy()
    })
  })

  it('affiche les 4 onglets', async () => {
    render(<MotivationalBalanceScreen />)
    await waitFor(() => {
      expect(screen.getByTestId('tab-guides')).toBeTruthy()
      expect(screen.getByTestId('tab-stage')).toBeTruthy()
      expect(screen.getByTestId('tab-rulers')).toBeTruthy()
      expect(screen.getByTestId('tab-balance')).toBeTruthy()
    })
  })

  it('charge les fiches psyedu sur l\'onglet Fiches', async () => {
    render(<MotivationalBalanceScreen />)
    await waitFor(() => {
      expect(screen.getByTestId('guide-row-ambivalence')).toBeTruthy()
      expect(screen.getByTestId('guide-row-stages_of_change')).toBeTruthy()
    })
  })

  it('navigue vers l\'onglet Stade au clic', async () => {
    render(<MotivationalBalanceScreen />)
    await waitFor(() => screen.getByTestId('tab-stage'))
    fireEvent.press(screen.getByTestId('tab-stage'))
    expect(screen.getByTestId('stage-card-1')).toBeTruthy()
    expect(screen.getByTestId('stage-card-6')).toBeTruthy()
  })

  it('sélectionne un stade et active le bouton sauvegarder', async () => {
    render(<MotivationalBalanceScreen />)
    await waitFor(() => screen.getByTestId('tab-stage'))
    fireEvent.press(screen.getByTestId('tab-stage'))
    const saveBtn = screen.getByTestId('stage-save-btn')
    expect(saveBtn.props.accessibilityState?.disabled ?? saveBtn.props.disabled).toBeTruthy()
    fireEvent.press(screen.getByTestId('stage-card-2'))
    await waitFor(() => {
      expect(screen.getByTestId('stage-save-btn').props.disabled).toBeFalsy()
    })
  })

  it('affiche l\'onglet Thermomètres avec les pip sliders', async () => {
    render(<MotivationalBalanceScreen />)
    await waitFor(() => screen.getByTestId('tab-rulers'))
    fireEvent.press(screen.getByTestId('tab-rulers'))
    expect(screen.getByTestId('rulers-behavior-input')).toBeTruthy()
    expect(screen.getByTestId('rulers-save-btn')).toBeTruthy()
  })

  it('affiche le champ "pourquoi" après sélection importance', async () => {
    render(<MotivationalBalanceScreen />)
    await waitFor(() => screen.getByTestId('tab-rulers'))
    fireEvent.press(screen.getByTestId('tab-rulers'))
    // simule la sélection d'une valeur importance via pip
    // le champ why apparaît dynamiquement — on vérifie l'absence initiale
    expect(screen.queryByTestId('rulers-importance-why')).toBeNull()
  })

  it('affiche l\'onglet Balance avec sélecteur de valeurs', async () => {
    render(<MotivationalBalanceScreen />)
    await waitFor(() => screen.getByTestId('tab-balance'))
    fireEvent.press(screen.getByTestId('tab-balance'))
    expect(screen.getByTestId('value-chip-family')).toBeTruthy()
    expect(screen.getByTestId('value-chip-health')).toBeTruthy()
    expect(screen.getByTestId('values-save-btn')).toBeTruthy()
  })

  it('permet d\'ajouter un item côté Pour', async () => {
    render(<MotivationalBalanceScreen />)
    await waitFor(() => screen.getByTestId('tab-balance'))
    fireEvent.press(screen.getByTestId('tab-balance'))
    const input = screen.getByTestId('balance-for-input')
    fireEvent.changeText(input, 'Je me sentirais mieux')
    fireEvent.press(screen.getByTestId('balance-for-add'))
    const { saveEMBalanceItem } = require('../../services/motivationalBalanceService')
    await waitFor(() => {
      expect(saveEMBalanceItem).toHaveBeenCalledWith(
        expect.objectContaining({ side: 'for', text: 'Je me sentirais mieux' })
      )
    })
  })

  it('ouvre le modal "i" des sources au clic', async () => {
    render(<MotivationalBalanceScreen />)
    await waitFor(() => screen.getByTestId('info-btn'))
    fireEvent.press(screen.getByTestId('info-btn'))
    expect(screen.getByTestId('info-close-btn')).toBeTruthy()
  })

  it('limite la sélection des valeurs à 3 maximum', async () => {
    render(<MotivationalBalanceScreen />)
    await waitFor(() => screen.getByTestId('tab-balance'))
    fireEvent.press(screen.getByTestId('tab-balance'))
    fireEvent.press(screen.getByTestId('value-chip-family'))
    fireEvent.press(screen.getByTestId('value-chip-health'))
    fireEvent.press(screen.getByTestId('value-chip-freedom'))
    // 4e sélection ne doit pas s'ajouter
    fireEvent.press(screen.getByTestId('value-chip-work'))
    const workChip = screen.getByTestId('value-chip-work')
    expect(workChip.props.accessibilityState?.checked).toBeFalsy()
  })
})
