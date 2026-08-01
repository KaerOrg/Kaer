jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons')
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }))

import React from 'react'
import { StyleSheet } from 'react-native'
import { render, screen, fireEvent, act } from '@testing-library/react-native'
import { colors } from '@theme'
import { TreeSelector } from './TreeSelector'
import type {
  TreeSelectorConfig, TreeSelectorEntry, TreeSelectorNode,
  TreeSelectorSubmit, TreeSelectorTexts,
} from './types'

// ─── Données de test (primitive isolé — aucun moteur de modules, aucune i18n) ──

const NODES: TreeSelectorNode[] = [
  {
    id: 'joy', label: 'Joie', color: '#F59E0B', icon: 'emoticon-happy-outline',
    children: [
      {
        id: 'joy.serenity', label: 'Sérénité',
        children: [
          { id: 'joy.serenity.calm', label: 'Calme', children: [] },
          { id: 'joy.serenity.peace', label: 'Paix', children: [] },
        ],
      },
    ],
  },
  { id: 'fear', label: 'Peur', color: '#6EE7B7', icon: 'alert-circle-outline', children: [] },
]

const BASE_TEXTS: TreeSelectorTexts = {
  newBtn: 'Identifier', intro: 'Choisissez une émotion', historyLabel: 'Historique',
  emptyTitle: 'Rien encore', emptyText: 'Commencez', intensityTitle: 'Intensité',
  intensityHint: 'De 1 à 10', contextTitle: 'Contexte', contextHint: 'Optionnel',
  notesTitle: 'Notes', notesHint: 'Libre', notesPlaceholder: 'Écrivez…',
  continueBtn: 'Continuer', saveBtn: 'Enregistrer', validateHereBtn: 'Je ne sais pas',
  validateHereKeep: (label: string) => `on garde « ${label} »`,
  cancel: 'Annuler', back: 'Retour', delete: 'Supprimer',
  stepTitles: { 1: 'Émotion principale', 3: 'Émotion spécifique' },
  stepHints: { 1: 'Indice 1', 2: 'Indice 2', 3: 'Indice 3' },
}

function makeConfig(over: Partial<TreeSelectorConfig> = {}): TreeSelectorConfig {
  return {
    enableIntensity: true, enableNotes: true, enableContext: false,
    enableEarlyValidate: false, intensityMax: 10, midIntensity: 5,
    intensityValues: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], contextOptions: [],
    ...over,
  }
}

const ENTRY: TreeSelectorEntry = {
  id: 'sel-1', accentColor: '#F59E0B', icon: 'emoticon-happy-outline', emoji: undefined,
  primaryLabel: 'Joie', secondaryLabel: 'Sérénité · Calme', intensityLabel: '6/10',
  contextLabels: ['Travail'], notes: 'au lever', dateLabel: '05/05/2026',
}

interface Overrides {
  entries?: TreeSelectorEntry[]
  config?: TreeSelectorConfig
  texts?: TreeSelectorTexts
  loading?: boolean
  saving?: boolean
  footerText?: string | null
  onSubmit?: (r: TreeSelectorSubmit) => Promise<void>
  onDelete?: (id: string) => void
}

function renderTree(over: Overrides = {}) {
  const onSubmit = over.onSubmit ?? jest.fn().mockResolvedValue(undefined)
  const onDelete = over.onDelete ?? jest.fn()
  render(
    <TreeSelector
      nodes={NODES}
      entries={over.entries ?? []}
      config={over.config ?? makeConfig()}
      texts={over.texts ?? BASE_TEXTS}
      footerText={over.footerText ?? null}
      loading={over.loading ?? false}
      saving={over.saving ?? false}
      onSubmit={onSubmit}
      onDelete={onDelete}
    />
  )
  return { onSubmit, onDelete }
}

// ─── Tests ─────────────────────────────────────────────────────────────────

describe('ui/TreeSelector (primitive)', () => {
  it('affiche un loader quand loading', () => {
    renderTree({ loading: true })
    expect(screen.queryByTestId('start-new-button')).toBeNull()
  })

  it('affiche l\'état vide quand aucune entrée', () => {
    renderTree()
    expect(screen.getByTestId('list-empty')).toBeTruthy()
    expect(screen.getByTestId('intro-card')).toBeTruthy()
  })

  it('rend les entrées passées + chips de contexte', () => {
    renderTree({ entries: [ENTRY] })
    expect(screen.getByTestId('entry-card-sel-1')).toBeTruthy()
    expect(screen.getByTestId('chips-sel-1')).toBeTruthy()
  })

  it('appelle onDelete au tap sur la corbeille', () => {
    const onDelete = jest.fn()
    renderTree({ entries: [ENTRY], onDelete })
    fireEvent.press(screen.getByTestId('delete-sel-1'))
    expect(onDelete).toHaveBeenCalledWith('sel-1')
  })

  it('passe en navigation niveau 1 au tap sur Nouveau', () => {
    renderTree()
    fireEvent.press(screen.getByTestId('start-new-button'))
    expect(screen.getByTestId('level-1-grid')).toBeTruthy()
    expect(screen.getByTestId('node-joy')).toBeTruthy()
    expect(screen.getByTestId('node-fear')).toBeTruthy()
  })

  it('descend dans l\'arbre puis atteint l\'intensité sur une feuille', () => {
    renderTree()
    fireEvent.press(screen.getByTestId('start-new-button'))
    fireEvent.press(screen.getByTestId('node-joy'))
    expect(screen.getByTestId('level-2-list')).toBeTruthy()
    fireEvent.press(screen.getByTestId('node-joy.serenity'))
    fireEvent.press(screen.getByTestId('node-joy.serenity.calm'))
    expect(screen.getByTestId('intensity-card')).toBeTruthy()
  })

  it('met à jour l\'intensité affichée au tap', () => {
    renderTree()
    fireEvent.press(screen.getByTestId('start-new-button'))
    fireEvent.press(screen.getByTestId('node-fear')) // feuille directe
    fireEvent.press(screen.getByTestId('intensity-btn-8'))
    expect(screen.getByTestId('intensity-value').props.children).toBe(8)
  })

  it('soumet pathIds + intensité + notes à l\'enregistrement', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    renderTree({ onSubmit })
    fireEvent.press(screen.getByTestId('start-new-button'))
    fireEvent.press(screen.getByTestId('node-fear'))
    fireEvent.press(screen.getByTestId('intensity-btn-7'))
    fireEvent.press(screen.getByTestId('continue-intensity'))
    fireEvent.changeText(screen.getByTestId('notes-input'), 'au lever')
    await act(async () => { fireEvent.press(screen.getByTestId('save-entry')) })
    expect(onSubmit).toHaveBeenCalledWith({
      pathIds: ['fear'], intensity: 7, context: [], notes: 'au lever',
    })
  })

  it('profondeur libre : valider une famille seule soumet son id', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    const config = makeConfig({ enableEarlyValidate: true, enableIntensity: false, enableNotes: false })
    renderTree({ config, onSubmit })
    fireEvent.press(screen.getByTestId('start-new-button'))
    fireEvent.press(screen.getByTestId('node-joy'))
    await act(async () => { fireEvent.press(screen.getByTestId('validate-here')) })
    expect(onSubmit).toHaveBeenCalledWith({
      pathIds: ['joy'], intensity: null, context: [], notes: '',
    })
  })

  // ── Passe rédaction + accessibilité (K-10, ticket #258) ───────────────────

  it('profondeur libre : le bouton dit « Je ne sais pas » et rappelle le niveau gardé en ligne secondaire', () => {
    const config = makeConfig({ enableEarlyValidate: true })
    renderTree({ config })
    fireEvent.press(screen.getByTestId('start-new-button'))
    fireEvent.press(screen.getByTestId('node-joy'))
    // Le libellé s'adresse au patient ; le niveau conservé descend en secondaire.
    expect(screen.getByText('Je ne sais pas')).toBeTruthy()
    expect(screen.getByText('on garde « Joie »')).toBeTruthy()
    // Plus aucune trace du libellé concaténé d'ingénieur.
    expect(screen.queryByText('Je ne sais pas : Joie')).toBeNull()
  })

  it('profondeur libre : l\'étiquette d\'accessibilité porte les deux lignes', () => {
    const config = makeConfig({ enableEarlyValidate: true })
    renderTree({ config })
    fireEvent.press(screen.getByTestId('start-new-button'))
    fireEvent.press(screen.getByTestId('node-joy'))
    expect(screen.getByTestId('validate-here').props.accessibilityLabel)
      .toBe('Je ne sais pas, on garde « Joie »')
  })

  it('la couleur de famille ne porte jamais de texte (contraste AA)', () => {
    renderTree()
    fireEvent.press(screen.getByTestId('start-new-button'))
    // Niveau 1 : le libellé de la carte est en couleur de texte, pas en teinte de famille.
    const joie = screen.getByText('Joie')
    expect(StyleSheet.flatten(joie.props.style).color).toBe(colors.text)
    fireEvent.press(screen.getByTestId('node-joy'))
    // Niveau 2 : idem sur la liste, la teinte ne reste que sur le filet gauche.
    const serenite = screen.getByText('Sérénité')
    expect(StyleSheet.flatten(serenite.props.style).color).toBe(colors.text)
  })

  it('les crans d\'intensité annoncent leur sélection au lecteur d\'écran', () => {
    renderTree({ config: makeConfig({ enableEarlyValidate: true, enableNotes: false }) })
    fireEvent.press(screen.getByTestId('start-new-button'))
    fireEvent.press(screen.getByTestId('node-joy'))
    fireEvent.press(screen.getByTestId('validate-here'))
    fireEvent.press(screen.getByTestId('intensity-btn-7'))
    expect(screen.getByTestId('intensity-btn-7').props.accessibilityState).toEqual({ selected: true })
    expect(screen.getByTestId('intensity-btn-3').props.accessibilityState).toEqual({ selected: false })
  })

  it('enchaîne l\'étape contexte et renvoie les codes sélectionnés', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    const config = makeConfig({
      enableContext: true, enableIntensity: false, enableNotes: false, enableEarlyValidate: true,
      contextOptions: [{ code: 'ctx.work', label: 'Travail', icon: 'briefcase-outline' }],
    })
    renderTree({ config, onSubmit })
    fireEvent.press(screen.getByTestId('start-new-button'))
    fireEvent.press(screen.getByTestId('node-joy'))
    fireEvent.press(screen.getByTestId('validate-here'))
    expect(screen.getByTestId('context-chips')).toBeTruthy()
    fireEvent.press(screen.getByTestId('context-ctx.work'))
    await act(async () => { fireEvent.press(screen.getByTestId('continue-context')) })
    expect(onSubmit).toHaveBeenCalledWith({
      pathIds: ['joy'], intensity: null, context: ['ctx.work'], notes: '',
    })
  })

  it('annule la saisie et revient à l\'historique', () => {
    renderTree()
    fireEvent.press(screen.getByTestId('start-new-button'))
    fireEvent.press(screen.getByTestId('node-fear'))
    fireEvent.press(screen.getByTestId('continue-intensity'))
    fireEvent.press(screen.getByTestId('cancel-entry'))
    expect(screen.getByTestId('list-empty')).toBeTruthy()
  })

  it('affiche la note de bas de page quand fournie', () => {
    renderTree({ footerText: 'Sources : Plutchik (1980)' })
    expect(screen.getByText('Sources : Plutchik (1980)')).toBeTruthy()
  })
})
