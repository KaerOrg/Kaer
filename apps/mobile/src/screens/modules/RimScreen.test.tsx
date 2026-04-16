import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import { Linking } from 'react-native'
import RimScreen from './RimScreen'

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

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}))

jest.mock('../../store/authStore', () => ({
  useAuthStore: (selector: (s: { patient: { id: string } }) => unknown) =>
    selector({ patient: { id: 'patient-uuid-1' } }),
}))

// ─── Helpers ──────────────────────────────────────────────────────────────────

import * as supabaseLib from '../../lib/supabase'

function mockSupabaseConfig(config: Record<string, unknown> | null, error = false) {
  const chain = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue(
      error
        ? { data: null, error: { message: 'Network error' } }
        : { data: config ? { config } : null, error: null }
    ),
  }
  ;(supabaseLib.supabase.from as jest.Mock).mockReturnValue(chain)
  return chain
}

const FULL_CONFIG = {
  alternative_scenario: 'Je me retrouve dans un pré verdoyant, le soleil brille doucement.',
  original_scenario: 'Le couloir sombre et angoissant.',
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('RimScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ── Chargement ────────────────────────────────────────────────────────────

  it('affiche le scénario alternatif quand la config est chargée', async () => {
    mockSupabaseConfig(FULL_CONFIG)
    render(<RimScreen />)
    expect(
      await screen.findByText('Je me retrouve dans un pré verdoyant, le soleil brille doucement.')
    ).toBeTruthy()
  })

  it('affiche le disclaimer de sécurité', async () => {
    mockSupabaseConfig(FULL_CONFIG)
    render(<RimScreen />)
    await screen.findByTestId('rim-disclaimer')
    expect(
      screen.getByText(/À utiliser exclusivement avec l'accompagnement/i)
    ).toBeTruthy()
  })

  it('affiche les 5 étapes du protocole', async () => {
    mockSupabaseConfig(FULL_CONFIG)
    render(<RimScreen />)
    await screen.findByTestId('protocol-steps')
    expect(screen.getByText(/Installez-vous confortablement/i)).toBeTruthy()
    expect(screen.getByText(/Respirez lentement/i)).toBeTruthy()
    expect(screen.getByText(/Lisez votre scénario/i)).toBeTruthy()
    expect(screen.getByText(/Fermez les yeux/i)).toBeTruthy()
    expect(screen.getByText(/Pratiquez chaque soir/i)).toBeTruthy()
  })

  // ── État vide ─────────────────────────────────────────────────────────────

  it('affiche l\'état vide si la config n\'a pas de scénario alternatif', async () => {
    mockSupabaseConfig({})
    render(<RimScreen />)
    expect(await screen.findByText('Scénario non configuré')).toBeTruthy()
  })

  it('affiche l\'état vide si la config est null', async () => {
    mockSupabaseConfig(null)
    render(<RimScreen />)
    expect(await screen.findByText('Scénario non configuré')).toBeTruthy()
  })

  // ── Erreur réseau ─────────────────────────────────────────────────────────

  it('affiche un message d\'erreur si Supabase échoue', async () => {
    mockSupabaseConfig(null, true)
    render(<RimScreen />)
    expect(
      await screen.findByText(/Impossible de charger le module/i)
    ).toBeTruthy()
  })

  // ── Scénario initial (optionnel) ──────────────────────────────────────────

  it('n\'affiche pas le bouton scénario initial si absent de la config', async () => {
    mockSupabaseConfig({ alternative_scenario: FULL_CONFIG.alternative_scenario })
    render(<RimScreen />)
    await screen.findByTestId('alternative-scenario-card')
    expect(screen.queryByText('Scénario initial (référence)')).toBeNull()
  })

  it('affiche le bouton scénario initial si présent dans la config', async () => {
    mockSupabaseConfig(FULL_CONFIG)
    render(<RimScreen />)
    expect(await screen.findByText('Scénario initial (référence)')).toBeTruthy()
  })

  it('affiche le scénario initial au tap sur le bouton', async () => {
    mockSupabaseConfig(FULL_CONFIG)
    render(<RimScreen />)
    fireEvent.press(await screen.findByText('Scénario initial (référence)'))
    expect(screen.getByText('Le couloir sombre et angoissant.')).toBeTruthy()
  })

  it('masque le scénario initial au second tap', async () => {
    mockSupabaseConfig(FULL_CONFIG)
    render(<RimScreen />)
    const btn = await screen.findByText('Scénario initial (référence)')
    fireEvent.press(btn)
    expect(screen.getByTestId('original-scenario-card')).toBeTruthy()
    fireEvent.press(btn)
    await waitFor(() => {
      expect(screen.queryByTestId('original-scenario-card')).toBeNull()
    })
  })

  // ── Sons d'ambiance ───────────────────────────────────────────────────────

  it('affiche les 5 boutons de sons d\'ambiance', async () => {
    mockSupabaseConfig(FULL_CONFIG)
    render(<RimScreen />)
    await screen.findByTestId('alternative-scenario-card')
    expect(screen.getByText('Pluie douce')).toBeTruthy()
    expect(screen.getByText('Vagues')).toBeTruthy()
    expect(screen.getByText('Forêt')).toBeTruthy()
    expect(screen.getByText('Vent doux')).toBeTruthy()
    expect(screen.getByText('Ruisseau')).toBeTruthy()
  })

  it('affiche "Bientôt" sur les sons non disponibles', async () => {
    mockSupabaseConfig(FULL_CONFIG)
    render(<RimScreen />)
    await screen.findByTestId('alternative-scenario-card')
    const bientot = screen.getAllByText('Bientôt')
    expect(bientot.length).toBe(5)
  })

  // ── Section urgence ───────────────────────────────────────────────────────

  it('affiche la section urgence avec le 3114 et le 15', async () => {
    mockSupabaseConfig(FULL_CONFIG)
    render(<RimScreen />)
    await screen.findByTestId('safety-section')
    expect(screen.getByText(/3114/)).toBeTruthy()
    expect(screen.getByText(/15 — SAMU/)).toBeTruthy()
  })

  it('appelle Linking.openURL avec tel:3114 au tap sur le 3114', async () => {
    mockSupabaseConfig(FULL_CONFIG)
    const linkingSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as never)
    render(<RimScreen />)
    fireEvent.press(
      await screen.findByLabelText('Appeler le 3114, numéro national de prévention du suicide')
    )
    expect(linkingSpy).toHaveBeenCalledWith('tel:3114')
  })

  // ── Conformité MDR ────────────────────────────────────────────────────────

  it('n\'affiche aucun score, seuil ou label interprétatif (conformité MDR)', async () => {
    mockSupabaseConfig(FULL_CONFIG)
    render(<RimScreen />)
    await screen.findByTestId('alternative-scenario-card')
    expect(screen.queryByText(/sévère/i)).toBeNull()
    expect(screen.queryByText(/amélioration/i)).toBeNull()
    expect(screen.queryByText(/score/i)).toBeNull()
    expect(screen.queryByText(/résultat/i)).toBeNull()
  })
})
