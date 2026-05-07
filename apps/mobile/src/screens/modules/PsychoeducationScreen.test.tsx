import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native'
import PsychoeducationScreen from './PsychoeducationScreen'
import CardDetailScreen from './CardDetailScreen'
import * as psychoeducationLib from '../../services/psychoeducationService'

// ─── Mocks des dépendances externes ──────────────────────────────────────────

jest.mock('@react-navigation/native', () => {
  const React = require('react')
  return {
    useFocusEffect: (cb: () => unknown) => {
      React.useEffect(() => {
        const cleanup = cb()
        return cleanup
      }, [])
    },
    useNavigation: () => ({ navigate: jest.fn() }),
    // jest.fn() permet de surcharger via mockReturnValueOnce dans les tests CardDetailScreen
    useRoute: jest.fn().mockReturnValue({
      params: { cardId: 'card_sleep_01', isRead: false },
    }),
  }
})

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}))

jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons')

// Mock du store auth — patient connecté avec un ID fixe
jest.mock('../../store/authStore', () => ({
  useAuthStore: (selector: (s: { patient: { id: string } }) => unknown) =>
    selector({ patient: { id: 'patient-uuid-123' } }),
}))

// Mock du client Supabase
const mockSingle = jest.fn()
const mockSupabaseChain = {
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  is: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  single: mockSingle,
}
jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => mockSupabaseChain),
  },
}))

// Mock de markCardAsRead pour les tests de CardDetailScreen
jest.mock('../../services/psychoeducationService', () => ({
  ...jest.requireActual('../../services/psychoeducationService'),
  markCardAsRead: jest.fn(),
}))

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Configure le mock Supabase pour retourner une liste de cartes débloquées. */
function mockSupabaseWithCards(
  cards: Array<{ card_id: string; is_read: boolean; unlocked_at: string }>
) {
  mockSingle.mockResolvedValueOnce({
    data: { config: { unlocked_cards: cards } },
    error: null,
  })
}

/** Configure le mock Supabase pour simuler une erreur réseau. */
function mockSupabaseWithError() {
  mockSingle.mockResolvedValueOnce({
    data: null,
    error: { message: 'Network error' },
  })
}

// ─── Tests : PsychoeducationScreen ───────────────────────────────────────────

describe('PsychoeducationScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ── Affichage des cartes débloquées ────────────────────────────────────────

  it('affiche uniquement les cartes débloquées par le praticien', async () => {
    mockSupabaseWithCards([
      { card_id: 'card_sleep_01', is_read: false, unlocked_at: '2024-01-01T00:00:00Z' },
      { card_id: 'card_grounding_01', is_read: false, unlocked_at: '2024-01-02T00:00:00Z' },
      // card_cbt_01 n'est pas débloquée
    ])

    render(<PsychoeducationScreen />)

    await waitFor(() => {
      expect(screen.getByTestId('card-row-card_sleep_01')).toBeTruthy()
      expect(screen.getByTestId('card-row-card_grounding_01')).toBeTruthy()
      // card_cbt_01 ne doit pas apparaître
      expect(screen.queryByTestId('card-row-card_cbt_01')).toBeNull()
    })
  })

  it('affiche les titres corrects des cartes débloquées', async () => {
    mockSupabaseWithCards([
      { card_id: 'card_sleep_01', is_read: false, unlocked_at: '2024-01-01T00:00:00Z' },
    ])

    render(<PsychoeducationScreen />)

    await waitFor(() => {
      expect(screen.getByText("Règles d'hygiène du sommeil")).toBeTruthy()
    })
  })

  it('affiche le badge "lu" pour les cartes déjà lues', async () => {
    mockSupabaseWithCards([
      { card_id: 'card_sleep_01', is_read: true, unlocked_at: '2024-01-01T00:00:00Z' },
      { card_id: 'card_grounding_01', is_read: false, unlocked_at: '2024-01-02T00:00:00Z' },
    ])

    render(<PsychoeducationScreen />)

    await waitFor(() => {
      expect(screen.getByTestId('read-badge-card_sleep_01')).toBeTruthy()
      expect(screen.getByTestId('unread-dot-card_grounding_01')).toBeTruthy()
    })
  })

  it("affiche le compteur de lecture correct (ex : 1/2 cartes lues)", async () => {
    mockSupabaseWithCards([
      { card_id: 'card_sleep_01', is_read: true, unlocked_at: '2024-01-01T00:00:00Z' },
      { card_id: 'card_grounding_01', is_read: false, unlocked_at: '2024-01-02T00:00:00Z' },
    ])

    render(<PsychoeducationScreen />)

    await waitFor(() => {
      expect(screen.getByText('1/2 cartes lues')).toBeTruthy()
    })
  })

  it("affiche l'état vide si aucune carte n'est débloquée", async () => {
    mockSupabaseWithCards([])

    render(<PsychoeducationScreen />)

    await waitFor(() => {
      expect(screen.getByText('Aucune carte disponible')).toBeTruthy()
    })
  })

  it('affiche un message d\'erreur si Supabase échoue', async () => {
    mockSupabaseWithError()

    render(<PsychoeducationScreen />)

    await waitFor(() => {
      expect(
        screen.getByText('Impossible de charger les cartes. Vérifiez votre connexion.')
      ).toBeTruthy()
    })
  })

  it('ignore les card_id inconnus du dictionnaire local', async () => {
    mockSupabaseWithCards([
      { card_id: 'card_sleep_01', is_read: false, unlocked_at: '2024-01-01T00:00:00Z' },
      // ID inexistant dans le dictionnaire — ne doit pas planter ni s'afficher
      { card_id: 'card_unknown_99', is_read: false, unlocked_at: '2024-01-02T00:00:00Z' },
    ])

    render(<PsychoeducationScreen />)

    await waitFor(() => {
      expect(screen.getByTestId('card-row-card_sleep_01')).toBeTruthy()
      expect(screen.queryByTestId('card-row-card_unknown_99')).toBeNull()
    })
  })
})

// ─── Tests : CardDetailScreen ─────────────────────────────────────────────────

describe('CardDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // useRoute retourne la carte sommeil non lue par défaut (défini dans le mock global)
  })

  it('affiche le contenu Markdown de la carte', async () => {
    render(<CardDetailScreen />)

    await waitFor(() => {
      expect(screen.getByTestId('markdown-content')).toBeTruthy()
    })
  })

  it('affiche le bouton "J\'ai lu et compris" pour une carte non lue', () => {
    render(<CardDetailScreen />)

    expect(screen.getByTestId('mark-as-read-button')).toBeTruthy()
    expect(screen.getByText("J'ai lu et compris")).toBeTruthy()
  })

  it('appelle markCardAsRead avec le bon card_id au clic', async () => {
    ;(psychoeducationLib.markCardAsRead as jest.Mock).mockResolvedValue(undefined)

    render(<CardDetailScreen />)

    fireEvent.press(screen.getByTestId('mark-as-read-button'))

    await waitFor(() => {
      expect(psychoeducationLib.markCardAsRead).toHaveBeenCalledTimes(1)
      expect(psychoeducationLib.markCardAsRead).toHaveBeenCalledWith(
        'patient-uuid-123',
        'card_sleep_01'
      )
    })
  })

  it('affiche un indicateur de chargement pendant la requête', async () => {
    // Simule un appel qui ne se résout pas immédiatement
    ;(psychoeducationLib.markCardAsRead as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 500))
    )

    render(<CardDetailScreen />)

    act(() => {
      fireEvent.press(screen.getByTestId('mark-as-read-button'))
    })

    expect(screen.getByTestId('read-loading-indicator')).toBeTruthy()
  })

  it('désactive le bouton et affiche "Lu et compris" après succès', async () => {
    ;(psychoeducationLib.markCardAsRead as jest.Mock).mockResolvedValue(undefined)

    render(<CardDetailScreen />)

    fireEvent.press(screen.getByTestId('mark-as-read-button'))

    await waitFor(() => {
      expect(screen.getByText('Lu et compris')).toBeTruthy()
    })

    // Le bouton est désactivé — un second appui ne doit pas relancer markCardAsRead
    fireEvent.press(screen.getByTestId('mark-as-read-button'))
    expect(psychoeducationLib.markCardAsRead).toHaveBeenCalledTimes(1)
  })

  it('affiche un message d\'erreur si markCardAsRead échoue', async () => {
    ;(psychoeducationLib.markCardAsRead as jest.Mock).mockRejectedValue(
      new Error('Supabase error')
    )

    render(<CardDetailScreen />)

    fireEvent.press(screen.getByTestId('mark-as-read-button'))

    await waitFor(() => {
      expect(screen.getByTestId('read-error-banner')).toBeTruthy()
    })
  })

  it('affiche directement "Lu et compris" si la carte est déjà lue (isRead = true)', () => {
    // Overrider useRoute pour simuler une carte déjà lue
    const { useRoute } = require('@react-navigation/native')
    ;(useRoute as jest.Mock).mockReturnValueOnce({
      params: { cardId: 'card_sleep_01', isRead: true },
    })

    render(<CardDetailScreen />)

    expect(screen.getByText('Lu et compris')).toBeTruthy()
    // Le bouton ne doit pas être utilisable
    fireEvent.press(screen.getByTestId('mark-as-read-button'))
    expect(psychoeducationLib.markCardAsRead).not.toHaveBeenCalled()
  })
})
