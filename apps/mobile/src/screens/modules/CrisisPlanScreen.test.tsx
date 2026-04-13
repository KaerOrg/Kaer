import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import { Linking } from 'react-native'
import CrisisPlanScreen from './CrisisPlanScreen'
import * as database from '../../lib/database'

// Le premier test React Native peut prendre plus de 5s (initialisation du renderer).
jest.setTimeout(15000)

// ─── Mocks des dépendances externes ──────────────────────────────────────────

jest.mock('@react-navigation/native', () => {
  const React = require('react')
  return {
    // Simule useFocusEffect comme un useEffect standard pour les tests
    useFocusEffect: (cb) => {
      React.useEffect(() => {
        cb()
      }, [])
    },
  }
})

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }) => children,
}))

jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons')

jest.mock('../../lib/database', () => ({
  getAllCrisisPlanItems: jest.fn().mockResolvedValue([]),
  saveCrisisPlanItem: jest.fn().mockResolvedValue(undefined),
  deleteCrisisPlanItem: jest.fn().mockResolvedValue(undefined),
  generateId: jest.fn().mockReturnValue('test-id-crisis'),
}))

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('CrisisPlanScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as never)
    ;(database.getAllCrisisPlanItems as jest.Mock).mockResolvedValue([])
  })

  // ── Test 1 : Les 6 étapes s'affichent ──────────────────────────────────────

  it('affiche les titres des 6 étapes du protocole Stanley & Brown', async () => {
    render(<CrisisPlanScreen />)

    // Attendre la fin du chargement via un testID stable
    await waitFor(() => expect(screen.getByTestId('step-header-1')).toBeTruthy())

    // Vérifier les 6 titres de façon synchrone (le rendu est terminé)
    expect(screen.getByText('Signes avant-coureurs')).toBeTruthy()
    expect(screen.getByText("Stratégies d'apaisement internes")).toBeTruthy()
    expect(screen.getByText('Personnes ou lieux de distraction')).toBeTruthy()
    expect(screen.getByText('Proches à contacter')).toBeTruthy()
    expect(screen.getByText('Professionnels et urgences')).toBeTruthy()
    expect(screen.getByText('Sécuriser mon environnement')).toBeTruthy()
  })

  it('affiche les labels "Étape N" pour chaque étape', async () => {
    render(<CrisisPlanScreen />)

    await waitFor(() => expect(screen.getByTestId('step-header-1')).toBeTruthy())

    for (let n = 1; n <= 6; n++) {
      expect(screen.getByText(`Étape ${n}`)).toBeTruthy()
    }
  })

  // ── Test 2 : Ajout d'un élément dans l'Étape 1 ─────────────────────────────

  it("permet d'ajouter un élément dans l'étape 1 et appelle saveCrisisPlanItem", async () => {
    render(<CrisisPlanScreen />)

    // Attendre la fin du chargement (les en-têtes des étapes sont visibles)
    await waitFor(() => {
      expect(screen.getByTestId('step-header-1')).toBeTruthy()
    })

    // Ouvrir l'étape 1 via l'accordéon
    fireEvent.press(screen.getByTestId('step-header-1'))

    // Le bouton "Ajouter un élément" est maintenant visible
    await waitFor(() => {
      expect(screen.getByTestId('add-to-step-1')).toBeTruthy()
    })
    fireEvent.press(screen.getByTestId('add-to-step-1'))

    // Saisir du texte dans l'input d'ajout
    const input = screen.getByTestId('new-item-input')
    fireEvent.changeText(input, 'Je me sens irritable et agité(e)')

    // Valider l'ajout
    fireEvent.press(screen.getByTestId('validate-new-item'))

    // Vérifier que la sauvegarde a bien été appelée avec les bons paramètres
    await waitFor(() => {
      expect(database.saveCrisisPlanItem).toHaveBeenCalledWith({
        id: 'test-id-crisis',
        step_number: 1,
        content: 'Je me sens irritable et agité(e)',
        position: 0,
      })
    })
  })

  it("n'appelle pas saveCrisisPlanItem si le texte est vide", async () => {
    render(<CrisisPlanScreen />)

    await waitFor(() => expect(screen.getByTestId('step-header-1')).toBeTruthy())

    fireEvent.press(screen.getByTestId('step-header-1'))
    await waitFor(() => expect(screen.getByTestId('add-to-step-1')).toBeTruthy())
    fireEvent.press(screen.getByTestId('add-to-step-1'))

    // Valider sans rien saisir (champ vide)
    fireEvent.press(screen.getByTestId('validate-new-item'))

    expect(database.saveCrisisPlanItem).not.toHaveBeenCalled()
  })

  it('masque le formulaire d\'ajout en appuyant sur "Annuler"', async () => {
    render(<CrisisPlanScreen />)

    await waitFor(() => expect(screen.getByTestId('step-header-1')).toBeTruthy())
    fireEvent.press(screen.getByTestId('step-header-1'))
    await waitFor(() => expect(screen.getByTestId('add-to-step-1')).toBeTruthy())
    fireEvent.press(screen.getByTestId('add-to-step-1'))

    expect(screen.getByTestId('new-item-input')).toBeTruthy()

    fireEvent.press(screen.getByTestId('cancel-new-item'))

    expect(screen.queryByTestId('new-item-input')).toBeNull()
  })

  // ── Test 3 : Bouton d'urgence 15 (SAMU) ────────────────────────────────────

  it('appelle le 15 (SAMU) via Linking.openURL en appuyant sur le bouton dédié', async () => {
    render(<CrisisPlanScreen />)

    await waitFor(() => {
      expect(screen.getByTestId('emergency-15')).toBeTruthy()
    })

    fireEvent.press(screen.getByTestId('emergency-15'))

    expect(Linking.openURL).toHaveBeenCalledWith('tel:15')
    expect(Linking.openURL).toHaveBeenCalledTimes(1)
  })

  // ── Test 4 : Bouton d'urgence 3114 (Prévention Suicide) ────────────────────

  it('appelle le 3114 (Prévention Suicide) via Linking.openURL en appuyant sur le bouton dédié', async () => {
    render(<CrisisPlanScreen />)

    await waitFor(() => {
      expect(screen.getByTestId('emergency-3114')).toBeTruthy()
    })

    fireEvent.press(screen.getByTestId('emergency-3114'))

    expect(Linking.openURL).toHaveBeenCalledWith('tel:3114')
    expect(Linking.openURL).toHaveBeenCalledTimes(1)
  })

  it('les deux boutons d\'urgence sont distincts et appellent des numéros différents', async () => {
    render(<CrisisPlanScreen />)

    await waitFor(() => {
      expect(screen.getByTestId('emergency-15')).toBeTruthy()
      expect(screen.getByTestId('emergency-3114')).toBeTruthy()
    })

    fireEvent.press(screen.getByTestId('emergency-15'))
    fireEvent.press(screen.getByTestId('emergency-3114'))

    expect(Linking.openURL).toHaveBeenNthCalledWith(1, 'tel:15')
    expect(Linking.openURL).toHaveBeenNthCalledWith(2, 'tel:3114')
  })
})
