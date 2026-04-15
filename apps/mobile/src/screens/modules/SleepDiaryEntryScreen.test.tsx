import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import SleepDiaryEntryScreen from './SleepDiaryEntryScreen'

// ─── Mocks des dépendances externes ──────────────────────────────────────────

jest.mock('@react-navigation/native', () => ({
  useRoute: () => ({ params: { date: '2026-04-10' } }),
  useNavigation: () => ({ goBack: jest.fn() }),
}))

jest.mock('../../lib/database', () => ({
  getSleepEntry: jest.fn().mockResolvedValue(null),
  saveSleepEntry: jest.fn().mockResolvedValue(undefined),
  deleteSleepEntry: jest.fn().mockResolvedValue(undefined),
  generateId: jest.fn().mockReturnValue('test-id-123'),
  computeSleepEfficiency: jest.requireActual('../../lib/database').computeSleepEfficiency,
}))

jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker')

jest.mock('../../components/Button', () => {
  const { TouchableOpacity, Text } = require('react-native')
  return ({ label, onPress }: { label: string; onPress: () => void }) => (
    <TouchableOpacity onPress={onPress}>
      <Text>{label}</Text>
    </TouchableOpacity>
  )
})

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}))

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('SleepDiaryEntryScreen — Efficacité du Sommeil', () => {
  it('affiche le score SE après saisie du temps d\'endormissement', async () => {
    render(<SleepDiaryEntryScreen />)

    // Saisit 0 minute d'endormissement → SE = 100 % (23h→7h, 0 min latence, 0 min réveils)
    // Le bloc SE s'affiche dès que les horaires par défaut sont valides
    const seText = await screen.findByText(/Efficacité du sommeil/i)
    expect(seText).toBeTruthy()
  })

  it('affiche un pourcentage de SE dans le bloc récapitulatif', async () => {
    render(<SleepDiaryEntryScreen />)

    // Avec les valeurs par défaut (23h→7h, 0 min latence, 0 min réveils) → SE = 100 %
    const scoreText = await screen.findByText(/100\s*%/)
    expect(scoreText).toBeTruthy()
  })

  it('met à jour la SE quand le temps d\'endormissement change', async () => {
    render(<SleepDiaryEntryScreen />)

    // Il y a deux champs "0" : on cible le premier (temps d'endormissement)
    // TPL = 480 min (23h→7h), TST = 480 - 60 = 420 min → SE = 88 %
    // (arrondi : 420/480 * 100 = 87.5 → 88)
    const allInputs = screen.getAllByPlaceholderText('0')
    fireEvent.changeText(allInputs[0], '60')

    const updatedScore = await screen.findByText(/88\s*%/)
    expect(updatedScore).toBeTruthy()
  })

  it('affiche le score SE brut pour une SE ≥ 85 % (conformité MDR — aucun label interprétatif)', async () => {
    render(<SleepDiaryEntryScreen />)

    // Valeurs par défaut → SE 100 % — seul le chiffre brut est affiché, pas de label
    const score = await screen.findByText(/100 %/)
    expect(score).toBeTruthy()
    // Aucun label interprétatif ne doit apparaître
    expect(screen.queryByText(/Bonne efficacité/i)).toBeNull()
  })

  it('affiche le score SE brut pour une SE < 70 % (conformité MDR — aucun label interprétatif)', async () => {
    render(<SleepDiaryEntryScreen />)

    // 200 minutes d'endormissement → TST = 480 - 200 = 280 min → SE = 58 %
    const allInputs = screen.getAllByPlaceholderText('0')
    fireEvent.changeText(allInputs[0], '200')

    const score = await screen.findByText(/58 %/)
    expect(score).toBeTruthy()
    // Aucun label interprétatif ne doit apparaître
    expect(screen.queryByText(/Efficacité insuffisante/i)).toBeNull()
  })
})
