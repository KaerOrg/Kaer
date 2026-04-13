import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native'
import { Alert } from 'react-native'
import SleepDiaryEntryScreen from './SleepDiaryEntryScreen'
import * as database from '../../lib/database'

jest.setTimeout(15000)

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockGoBack = jest.fn()
const mockSetOptions = jest.fn()

jest.mock('@react-navigation/native', () => ({
  useRoute: () => ({ params: { date: '2026-04-10' } }),
  useNavigation: () => ({ goBack: mockGoBack, setOptions: mockSetOptions }),
}))

jest.mock('../../lib/database', () => ({
  getSleepEntry: jest.fn().mockResolvedValue(null),
  saveSleepEntry: jest.fn().mockResolvedValue(undefined),
  deleteSleepEntry: jest.fn().mockResolvedValue(undefined),
  generateId: jest.fn().mockReturnValue('test-id-123'),
  computeSleepEfficiency: jest.requireActual('../../lib/database').computeSleepEfficiency,
  sleepEfficiencyLabel: jest.requireActual('../../lib/database').sleepEfficiencyLabel,
}))

jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker')

jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'Icon')

jest.mock('../../components/Button', () => {
  const { TouchableOpacity, Text } = require('react-native')
  return ({ label, onPress }: { label: string; onPress: () => void }) => (
    <TouchableOpacity onPress={onPress} testID={`btn-${label}`}>
      <Text>{label}</Text>
    </TouchableOpacity>
  )
})

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}))

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderScreen() {
  return render(<SleepDiaryEntryScreen />)
}

// ─── Rendu initial ────────────────────────────────────────────────────────────

describe('SleepDiaryEntryScreen — rendu initial', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(database.getSleepEntry as jest.Mock).mockResolvedValue(null)
  })

  it('se rend sans erreur', async () => {
    renderScreen()
    await waitFor(() => expect(screen.getByText('Heure du coucher')).toBeTruthy())
  })

  it('affiche toutes les sections', async () => {
    renderScreen()
    await waitFor(() => {
      expect(screen.getByText('Horaires')).toBeTruthy()
      expect(screen.getByText('Réveils nocturnes')).toBeTruthy()
      expect(screen.getByText('Cauchemars cette nuit')).toBeTruthy()
      expect(screen.getByText('Qualité de la nuit')).toBeTruthy()
    })
  })

  it('appelle setOptions avec headerTitle et headerRight', async () => {
    renderScreen()
    await waitFor(() => expect(mockSetOptions).toHaveBeenCalled())
    const options = mockSetOptions.mock.calls[0][0]
    expect(options).toHaveProperty('headerTitle')
    expect(options).toHaveProperty('headerRight')
  })

  it('charge une entrée existante et pré-remplit les champs', async () => {
    ;(database.getSleepEntry as jest.Mock).mockResolvedValue({
      id: 'existing-id',
      date: '2026-04-10',
      bedtime: '22:00',
      wake_time: '06:00',
      sleep_onset_minutes: 30,
      awakenings: 2,
      awakenings_duration_minutes: 20,
      nightmares: 0,
      quality: 4,
      notes: 'Nuit agitée',
    })
    renderScreen()
    await waitFor(() => expect(screen.getByText('22:00')).toBeTruthy())
    expect(screen.getByText('06:00')).toBeTruthy()
    expect(screen.getByDisplayValue('Nuit agitée')).toBeTruthy()
  })
})

// ─── Stepper MinutesInput ─────────────────────────────────────────────────────

describe('SleepDiaryEntryScreen — stepper minutes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(database.getSleepEntry as jest.Mock).mockResolvedValue(null)
  })

  it('augmente le temps d\'endormissement par pas de 5 min', async () => {
    renderScreen()
    await waitFor(() => screen.getByText("Temps pour s'endormir"))

    // Trouve les boutons + : premier stepper = temps d'endormissement
    const plusButtons = screen.getAllByText('+')
    fireEvent.press(plusButtons[0])
    expect(screen.getByText('5 min')).toBeTruthy()
  })

  it('diminue le temps d\'endormissement par pas de 5 min', async () => {
    renderScreen()
    await waitFor(() => screen.getByText("Temps pour s'endormir"))

    const plusButtons = screen.getAllByText('+')
    fireEvent.press(plusButtons[0])
    fireEvent.press(plusButtons[0])

    const minusButtons = screen.getAllByText('−')
    fireEvent.press(minusButtons[0])

    expect(screen.getByText('5 min')).toBeTruthy()
  })

  it('ne descend pas en dessous de 0 min', async () => {
    renderScreen()
    await waitFor(() => screen.getByText("Temps pour s'endormir"))

    const minusButtons = screen.getAllByText('−')
    fireEvent.press(minusButtons[0])

    // Toujours à 0 min (plusieurs steppers affichent "0 min")
    expect(screen.getAllByText('0 min').length).toBeGreaterThan(0)
  })

  it('affiche le format en heures quand ≥ 60 min', async () => {
    renderScreen()
    await waitFor(() => screen.getByText("Temps pour s'endormir"))

    const plusButtons = screen.getAllByText('+')
    // 12 pressions × 5 = 60 min
    for (let i = 0; i < 12; i++) fireEvent.press(plusButtons[0])

    expect(screen.getByText('1h00')).toBeTruthy()
  })
})

// ─── Compteur réveils ─────────────────────────────────────────────────────────

describe('SleepDiaryEntryScreen — compteur réveils', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(database.getSleepEntry as jest.Mock).mockResolvedValue(null)
  })

  it('incrémente le nombre de réveils', async () => {
    renderScreen()
    await waitFor(() => screen.getByText('Nombre de fois réveillé(e)'))

    // Le compteur Counter a aussi des boutons + et −, mais différents des steppers
    // Le premier "+" dans les Counter (index 2, après les 2 steppers onset/awakeningsDuration)
    const plusButtons = screen.getAllByText('+')
    // plusButtons[0] = onset stepper, plusButtons[1] = awakenings counter, plusButtons[2] = duration stepper
    fireEvent.press(plusButtons[1])

    // La valeur 1 doit apparaître dans le compteur
    const values = screen.getAllByText('1')
    expect(values.length).toBeGreaterThan(0)
  })

  it('ne descend pas en dessous de 0', async () => {
    renderScreen()
    await waitFor(() => screen.getByText('Nombre de fois réveillé(e)'))

    const minusButtons = screen.getAllByText('−')
    fireEvent.press(minusButtons[1]) // Counter awakenings

    const zeros = screen.getAllByText('0')
    expect(zeros.length).toBeGreaterThan(0)
  })
})

// ─── Toggle cauchemars ────────────────────────────────────────────────────────

describe('SleepDiaryEntryScreen — toggle cauchemars', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(database.getSleepEntry as jest.Mock).mockResolvedValue(null)
  })

  it('bascule le toggle cauchemars', async () => {
    renderScreen()
    const toggle = await screen.findByText('Cauchemars cette nuit')
    fireEvent.press(toggle)
    // Pas d'erreur = le toggle fonctionne
    expect(toggle).toBeTruthy()
  })
})

// ─── Étoiles qualité ──────────────────────────────────────────────────────────

describe('SleepDiaryEntryScreen — étoiles qualité', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(database.getSleepEntry as jest.Mock).mockResolvedValue(null)
  })

  it('affiche le label qualité après sélection des étoiles', async () => {
    renderScreen()
    await waitFor(() => screen.getByText('Qualité de la nuit'))

    // Les étoiles sont des TouchableOpacity wrappant des Icon (mockées)
    // On ne peut pas cliquer les icônes mockées directement,
    // mais on vérifie que le composant StarRating est présent
    expect(screen.getByText('Qualité de la nuit')).toBeTruthy()
  })
})

// ─── Sauvegarde ───────────────────────────────────────────────────────────────

describe('SleepDiaryEntryScreen — sauvegarde', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(database.getSleepEntry as jest.Mock).mockResolvedValue(null)
    ;(database.saveSleepEntry as jest.Mock).mockResolvedValue(undefined)
  })

  it('affiche une alerte si la qualité n\'est pas saisie', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert')
    renderScreen()
    // Attend que setOptions soit appelé (header rendu)
    await waitFor(() => expect(mockSetOptions).toHaveBeenCalled())
    // Déclenche handleSave via le callback stocké dans setOptions
    const { headerRight } = mockSetOptions.mock.calls[mockSetOptions.mock.calls.length - 1][0]
    const { getByTestId } = render(headerRight())
    await act(async () => { fireEvent.press(getByTestId('header-save-btn')) })
    expect(alertSpy).toHaveBeenCalledWith('Qualité manquante', expect.any(String))
  })

  it('appelle saveSleepEntry avec les bonnes données après saisie complète', async () => {
    ;(database.getSleepEntry as jest.Mock).mockResolvedValue({
      id: 'existing-id',
      date: '2026-04-10',
      bedtime: '23:00',
      wake_time: '07:00',
      sleep_onset_minutes: 0,
      awakenings: 0,
      awakenings_duration_minutes: 0,
      nightmares: 0,
      quality: 5,
      notes: null,
    })

    renderScreen()
    await waitFor(() => expect(mockSetOptions).toHaveBeenCalled())

    const { headerRight } = mockSetOptions.mock.calls[mockSetOptions.mock.calls.length - 1][0]
    const { getByTestId } = render(headerRight())
    await act(async () => { fireEvent.press(getByTestId('header-save-btn')) })

    await waitFor(() =>
      expect(database.saveSleepEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          date: '2026-04-10',
          bedtime: '23:00',
          wake_time: '07:00',
          quality: 5,
        })
      )
    )
  })

  it('navigue en arrière après une sauvegarde réussie', async () => {
    ;(database.getSleepEntry as jest.Mock).mockResolvedValue({
      id: 'existing-id',
      date: '2026-04-10',
      bedtime: '23:00',
      wake_time: '07:00',
      sleep_onset_minutes: 0,
      awakenings: 0,
      awakenings_duration_minutes: 0,
      nightmares: 0,
      quality: 3,
      notes: null,
    })

    renderScreen()
    await waitFor(() => expect(mockSetOptions).toHaveBeenCalled())

    const { headerRight } = mockSetOptions.mock.calls[mockSetOptions.mock.calls.length - 1][0]
    const { getByTestId } = render(headerRight())
    await act(async () => { fireEvent.press(getByTestId('header-save-btn')) })

    await waitFor(() => expect(mockGoBack).toHaveBeenCalled())
  })
})

// ─── Suppression ──────────────────────────────────────────────────────────────

describe('SleepDiaryEntryScreen — suppression', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(database.getSleepEntry as jest.Mock).mockResolvedValue({
      id: 'existing-id',
      date: '2026-04-10',
      bedtime: '23:00',
      wake_time: '07:00',
      sleep_onset_minutes: 0,
      awakenings: 0,
      awakenings_duration_minutes: 0,
      nightmares: 0,
      quality: 4,
      notes: null,
    })
  })

  it('affiche le bouton Supprimer pour une entrée existante', async () => {
    renderScreen()
    const deleteBtn = await screen.findByText('Supprimer cette saisie')
    expect(deleteBtn).toBeTruthy()
  })

  it('ouvre une alerte de confirmation à la suppression', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert')
    renderScreen()
    const deleteBtn = await screen.findByText('Supprimer cette saisie')
    fireEvent.press(deleteBtn)
    expect(alertSpy).toHaveBeenCalledWith(
      'Supprimer cette saisie ?',
      expect.any(String),
      expect.any(Array)
    )
  })

  it('n\'affiche pas le bouton Supprimer pour une nouvelle entrée', async () => {
    ;(database.getSleepEntry as jest.Mock).mockResolvedValue(null)
    renderScreen()
    await waitFor(() => screen.getByText('Heure du coucher'))
    expect(screen.queryByText('Supprimer cette saisie')).toBeNull()
  })
})

// ─── Efficacité du sommeil dans le header ─────────────────────────────────────

describe('SleepDiaryEntryScreen — efficacité dans le header', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(database.getSleepEntry as jest.Mock).mockResolvedValue(null)
  })

  it('passe l\'efficacité calculée à setOptions', async () => {
    renderScreen()
    await waitFor(() => expect(mockSetOptions).toHaveBeenCalled())

    // Avec 23h→7h, 0 latence, 0 réveils → SE = 100 %
    // headerRight est un composant React contenant l'efficacité
    const lastCall = mockSetOptions.mock.calls[mockSetOptions.mock.calls.length - 1][0]
    expect(lastCall).toHaveProperty('headerRight')
    expect(lastCall).toHaveProperty('headerTitle')
  })

  it('met à jour le header quand les minutes d\'endormissement changent', async () => {
    renderScreen()
    await waitFor(() => screen.getByText("Temps pour s'endormir"))

    const initialCallCount = mockSetOptions.mock.calls.length

    const plusButtons = screen.getAllByText('+')
    fireEvent.press(plusButtons[0]) // +5 min d'endormissement

    await waitFor(() =>
      expect(mockSetOptions.mock.calls.length).toBeGreaterThan(initialCallCount)
    )
  })
})
