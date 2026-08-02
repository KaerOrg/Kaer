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
    id: 'joy', label: 'Joie', color: '#EFC98A', icon: 'emoticon-happy-outline',
    definition: 'plaisir, élan, gratitude',
    children: [
      {
        id: 'joy.serenity', label: 'Sérénité',
        definition: 'tournée vers ce qui vient de se passer',
        children: [
          { id: 'joy.serenity.calm', label: 'Calme', children: [] },
          { id: 'joy.serenity.peace', label: 'Paix', children: [] },
        ],
      },
      // Nuance sans mots : un tap suffit, aucune chip (cas des 16 nuances élaguées).
      { id: 'joy.calm', label: 'Quiétude', definition: 'rien ne presse', children: [] },
    ],
  },
  {
    id: 'fear', label: 'Peur', color: '#AC9BDE', icon: 'alert-circle-outline',
    definition: 'menace, incertitude', children: [],
  },
]

const BASE_TEXTS: TreeSelectorTexts = {
  newBtn: 'Identifier', intro: 'Choisissez une émotion', historyLabel: 'Historique',
  emptyTitle: 'Rien encore', emptyText: 'Commencez',
  entryTitle: 'Vous pouvez enregistrer, ou préciser.',
  intensityTitle: 'Force',
  intensityAnchorMin: 'à peine', intensityAnchorMax: 'au maximum',
  contextTitle: 'En lien avec',
  contextOtherBtn: 'Autre', contextOtherPlaceholder: 'En lien avec quoi ?',
  notesTitle: 'Qu’est-ce qui s’est passé ?', notesPlaceholder: 'Écrivez…',
  continueBtn: 'Continuer', saveBtn: 'Enregistrer', validateHereBtn: 'Je ne sais pas',
  validateHereKeep: (label: string) => `on garde « ${label} »`,
  skipBtn: 'Je ne sais pas trop', stopHint: 'S’arrêter à la famille est déjà une réponse.',
  cancel: 'Annuler', back: 'Retour', delete: 'Supprimer',
  stepTitles: { 1: 'Émotion principale', 3: 'Émotion spécifique' },
  stepHints: { 1: 'Indice 1', 2: 'Indice 2', 3: 'Indice 3' },
}

function makeConfig(over: Partial<TreeSelectorConfig> = {}): TreeSelectorConfig {
  return {
    enableIntensity: true, enableNotes: true, enableContext: false,
    enableEarlyValidate: false,
    intensityValues: [1, 2, 3, 4, 5], contextOptions: [],
    ...over,
  }
}

const ENTRY: TreeSelectorEntry = {
  id: 'sel-1', accentColor: '#EFC98A', icon: 'emoticon-happy-outline',
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
  onSkip?: () => void
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
      onSkip={over.onSkip}
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

  it('descend dans l\'arbre puis atteint la fiche unique sur une feuille', () => {
    renderTree()
    fireEvent.press(screen.getByTestId('start-new-button'))
    fireEvent.press(screen.getByTestId('node-joy'))
    expect(screen.getByTestId('level-2-list')).toBeTruthy()
    // La nuance porte des mots : elle se déplie sur place, sans écran de plus (K-5).
    fireEvent.press(screen.getByTestId('node-joy.serenity'))
    expect(screen.getByTestId('chips-of-joy.serenity')).toBeTruthy()
    fireEvent.press(screen.getByTestId('leaf-joy.serenity.calm'))
    expect(screen.getByTestId('intensity-section')).toBeTruthy()
  })

  it('soumet pathIds + intensité + notes à l\'enregistrement', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    renderTree({ onSubmit })
    fireEvent.press(screen.getByTestId('start-new-button'))
    fireEvent.press(screen.getByTestId('node-fear'))
    // Un seul écran : intensité, contexte et note se saisissent au même endroit (K-6).
    fireEvent.press(screen.getByTestId('intensity-btn-4'))
    fireEvent.changeText(screen.getByTestId('notes-input'), 'au lever')
    await act(async () => { fireEvent.press(screen.getByTestId('save-entry')) })
    expect(onSubmit).toHaveBeenCalledWith({
      pathIds: ['fear'], intensity: 4, context: [], contextOther: '', notes: 'au lever',
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
      pathIds: ['joy'], intensity: null, context: [], contextOther: '', notes: '',
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
    fireEvent.press(screen.getByTestId('intensity-btn-4'))
    expect(screen.getByTestId('intensity-btn-4').props.accessibilityState).toEqual({ selected: true })
    expect(screen.getByTestId('intensity-btn-3').props.accessibilityState).toEqual({ selected: false })
  })

  // ── Fiche unique (K-6, ticket #254) ───────────────────────────────────────

  it('réunit intensité, contexte et note sur un seul écran', () => {
    const config = makeConfig({
      enableContext: true,
      contextOptions: [{ code: 'ctx.work', label: 'Travail', icon: 'briefcase-outline' }],
    })
    renderTree({ config })
    fireEvent.press(screen.getByTestId('start-new-button'))
    fireEvent.press(screen.getByTestId('node-fear'))
    expect(screen.getByTestId('intensity-section')).toBeTruthy()
    expect(screen.getByTestId('context-section')).toBeTruthy()
    expect(screen.getByTestId('notes-section')).toBeTruthy()
    expect(screen.getByTestId('save-entry')).toBeTruthy()
  })

  it('l\'intensité n\'a aucune valeur par défaut : rien n\'est présélectionné', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    renderTree({ onSubmit })
    fireEvent.press(screen.getByTestId('start-new-button'))
    fireEvent.press(screen.getByTestId('node-fear'))
    for (const v of [1, 2, 3, 4, 5]) {
      expect(screen.getByTestId(`intensity-btn-${v}`).props.accessibilityState).toEqual({ selected: false })
    }
    // Enregistrer sans y toucher laisse l'intensité nulle, pas une valeur inventée.
    await act(async () => { fireEvent.press(screen.getByTestId('save-entry')) })
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ intensity: null }))
  })

  it('re-taper le cran actif le désélectionne : le champ reste facultatif', () => {
    renderTree()
    fireEvent.press(screen.getByTestId('start-new-button'))
    fireEvent.press(screen.getByTestId('node-fear'))
    fireEvent.press(screen.getByTestId('intensity-btn-3'))
    expect(screen.getByTestId('intensity-btn-3').props.accessibilityState).toEqual({ selected: true })
    fireEvent.press(screen.getByTestId('intensity-btn-3'))
    expect(screen.getByTestId('intensity-btn-3').props.accessibilityState).toEqual({ selected: false })
  })

  it('affiche les ancrages aux bornes de l\'échelle, sans label sur les valeurs', () => {
    renderTree()
    fireEvent.press(screen.getByTestId('start-new-button'))
    fireEvent.press(screen.getByTestId('node-fear'))
    expect(screen.getByText('à peine')).toBeTruthy()
    expect(screen.getByText('au maximum')).toBeTruthy()
  })

  it('« + Autre » ouvre un champ libre, stocké comme contexte', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    const config = makeConfig({
      enableContext: true, enableIntensity: false, enableNotes: false,
      contextOptions: [{ code: 'ctx.work', label: 'Travail', icon: 'briefcase-outline' }],
    })
    renderTree({ config, onSubmit })
    fireEvent.press(screen.getByTestId('start-new-button'))
    fireEvent.press(screen.getByTestId('node-fear'))
    expect(screen.queryByTestId('context-other-input')).toBeNull()
    fireEvent.press(screen.getByTestId('context-other'))
    fireEvent.changeText(screen.getByTestId('context-other-input'), 'trajet du matin')
    await act(async () => { fireEvent.press(screen.getByTestId('save-entry')) })
    // Séparé des codes i18n : un texte patient ne passe pas dans t().
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      context: [], contextOther: 'trajet du matin',
    }))
  })

  it('refermer « + Autre » efface la saisie', () => {
    const config = makeConfig({
      enableContext: true,
      contextOptions: [{ code: 'ctx.work', label: 'Travail', icon: 'briefcase-outline' }],
    })
    renderTree({ config })
    fireEvent.press(screen.getByTestId('start-new-button'))
    fireEvent.press(screen.getByTestId('node-fear'))
    fireEvent.press(screen.getByTestId('context-other'))
    fireEvent.changeText(screen.getByTestId('context-other-input'), 'trajet')
    fireEvent.press(screen.getByTestId('context-other'))
    expect(screen.queryByTestId('context-other-input')).toBeNull()
  })

  // ── Choix de la famille (K-4, ticket #252) ────────────────────────────────

  it('affiche la définition sous le titre de chaque famille, sans emoji ni pictogramme', () => {
    renderTree()
    fireEvent.press(screen.getByTestId('start-new-button'))
    expect(screen.getByText('plaisir, élan, gratitude')).toBeTruthy()
    expect(screen.getByText('menace, incertitude')).toBeTruthy()
  })

  it('l\'étiquette d\'accessibilité d\'une famille porte son titre et sa définition', () => {
    renderTree()
    fireEvent.press(screen.getByTestId('start-new-button'))
    expect(screen.getByTestId('node-fear').props.accessibilityLabel)
      .toBe('Peur, menace, incertitude')
  })

  it('n\'affiche la sortie « Je ne sais pas trop » que si onSkip est fourni', () => {
    renderTree()
    fireEvent.press(screen.getByTestId('start-new-button'))
    // Sans callback : pas de porte de sortie, donc pas de bouton mort.
    expect(screen.queryByTestId('skip-emotion')).toBeNull()
  })

  it('appelle onSkip et rappelle qu\'on peut s\'arrêter à la famille', () => {
    const onSkip = jest.fn()
    renderTree({ onSkip })
    fireEvent.press(screen.getByTestId('start-new-button'))
    expect(screen.getByText('S’arrêter à la famille est déjà une réponse.')).toBeTruthy()
    fireEvent.press(screen.getByTestId('skip-emotion'))
    expect(onSkip).toHaveBeenCalledTimes(1)
  })

  it('la sortie n\'apparaît qu\'au niveau 1', () => {
    const onSkip = jest.fn()
    renderTree({ onSkip })
    fireEvent.press(screen.getByTestId('start-new-button'))
    fireEvent.press(screen.getByTestId('node-joy'))
    expect(screen.queryByTestId('skip-emotion')).toBeNull()
  })

  // ── Nuances : définition, mots en chips, plus d'écran de niveau 3 (K-5, #253) ──

  it('affiche la définition de chaque nuance sous son nom', () => {
    renderTree()
    fireEvent.press(screen.getByTestId('start-new-button'))
    fireEvent.press(screen.getByTestId('node-joy'))
    expect(screen.getByText('tournée vers ce qui vient de se passer')).toBeTruthy()
  })

  it('une nuance sans mots enchaîne directement : trois taps pour une saisie', () => {
    renderTree({ config: makeConfig({ enableIntensity: false, enableContext: false }) })
    fireEvent.press(screen.getByTestId('start-new-button'))   // 1
    fireEvent.press(screen.getByTestId('node-joy'))
    fireEvent.press(screen.getByTestId('node-joy.calm'))      // nuance sans chips
    // Pas de chips, pas d'écran de plus : on est déjà sur la fiche finale.
    expect(screen.getByTestId('notes-input')).toBeTruthy()
  })

  it('déplier une nuance ne descend pas d\'un niveau : les mots sont des chips', () => {
    renderTree()
    fireEvent.press(screen.getByTestId('start-new-button'))
    fireEvent.press(screen.getByTestId('node-joy'))
    fireEvent.press(screen.getByTestId('node-joy.serenity'))
    // Toujours la liste des nuances, avec les mots dépliés dedans.
    expect(screen.getByTestId('level-2-list')).toBeTruthy()
    expect(screen.getByTestId('chips-of-joy.serenity')).toBeTruthy()
    expect(screen.getByText('Calme')).toBeTruthy()
    expect(screen.getByText('Paix')).toBeTruthy()
  })

  it('re-taper une nuance dépliée la referme', () => {
    renderTree()
    fireEvent.press(screen.getByTestId('start-new-button'))
    fireEvent.press(screen.getByTestId('node-joy'))
    fireEvent.press(screen.getByTestId('node-joy.serenity'))
    fireEvent.press(screen.getByTestId('node-joy.serenity'))
    expect(screen.queryByTestId('chips-of-joy.serenity')).toBeNull()
  })

  it('« Continuer » valide la nuance dépliée sans descendre au mot', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    const config = makeConfig({ enableIntensity: false, enableNotes: false, enableEarlyValidate: true })
    renderTree({ config, onSubmit })
    fireEvent.press(screen.getByTestId('start-new-button'))
    fireEvent.press(screen.getByTestId('node-joy'))
    fireEvent.press(screen.getByTestId('node-joy.serenity'))
    await act(async () => { fireEvent.press(screen.getByTestId('continue-selection')) })
    expect(onSubmit).toHaveBeenCalledWith({
      pathIds: ['joy', 'joy.serenity'], intensity: null, context: [], contextOther: '', notes: '',
    })
  })

  it('choisir un mot conserve la nuance dans le chemin enregistré', async () => {
    // Régression : la carte dépliée n'est pas « traversée », elle n'entre donc pas
    // dans le chemin toute seule. Sans l'insérer, l'entrée perdait sa nuance.
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    const config = makeConfig({ enableIntensity: false, enableNotes: false })
    renderTree({ config, onSubmit })
    fireEvent.press(screen.getByTestId('start-new-button'))
    fireEvent.press(screen.getByTestId('node-joy'))
    fireEvent.press(screen.getByTestId('node-joy.serenity'))
    await act(async () => { fireEvent.press(screen.getByTestId('leaf-joy.serenity.calm')) })
    expect(onSubmit).toHaveBeenCalledWith({
      pathIds: ['joy', 'joy.serenity', 'joy.serenity.calm'],
      intensity: null, context: [], contextOther: '', notes: '',
    })
  })

  it('« Continuer » n\'apparaît qu\'une fois une nuance dépliée', () => {
    renderTree({ config: makeConfig({ enableEarlyValidate: true }) })
    fireEvent.press(screen.getByTestId('start-new-button'))
    fireEvent.press(screen.getByTestId('node-joy'))
    expect(screen.queryByTestId('continue-selection')).toBeNull()
    fireEvent.press(screen.getByTestId('node-joy.serenity'))
    expect(screen.getByTestId('continue-selection')).toBeTruthy()
  })

  it('le retour referme la carte dépliée avant de remonter d\'un niveau', () => {
    renderTree()
    fireEvent.press(screen.getByTestId('start-new-button'))
    fireEvent.press(screen.getByTestId('node-joy'))
    fireEvent.press(screen.getByTestId('node-joy.serenity'))
    fireEvent.press(screen.getByTestId('back-button'))
    expect(screen.queryByTestId('chips-of-joy.serenity')).toBeNull()
    expect(screen.getByTestId('level-2-list')).toBeTruthy()
    fireEvent.press(screen.getByTestId('back-button'))
    expect(screen.getByTestId('level-1-grid')).toBeTruthy()
  })

  it('renvoie les codes de contexte sélectionnés', async () => {
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
    await act(async () => { fireEvent.press(screen.getByTestId('save-entry')) })
    expect(onSubmit).toHaveBeenCalledWith({
      pathIds: ['joy'], intensity: null, context: ['ctx.work'], contextOther: '', notes: '',
    })
  })

  it('annule la saisie et revient à l\'historique', () => {
    renderTree()
    fireEvent.press(screen.getByTestId('start-new-button'))
    fireEvent.press(screen.getByTestId('node-fear'))
    fireEvent.press(screen.getByTestId('cancel-entry'))
    expect(screen.getByTestId('list-empty')).toBeTruthy()
  })

  it('affiche la note de bas de page quand fournie', () => {
    renderTree({ footerText: 'Sources : Plutchik (1980)' })
    expect(screen.getByText('Sources : Plutchik (1980)')).toBeTruthy()
  })
})
