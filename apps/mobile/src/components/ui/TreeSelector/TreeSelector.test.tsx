jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons')
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }))

import React from 'react'
import { StyleSheet } from 'react-native'
import { render, screen, fireEvent, act } from '@testing-library/react-native'
import { colors } from '@theme'
import { TreeSelector } from './TreeSelector'
import type {
  TreeSelectorConfig, TreeSelectorEditRequest, TreeSelectorEntry,
  TreeSelectorEntrySection, TreeSelectorNode,
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
  newBtn: 'Noter un moment', historyLabel: 'Historique',
  emptyTitle: 'Rien encore', emptyText: 'Commencez',
  entryTitle: 'Vous pouvez enregistrer, ou préciser.',
  wordlessTitle: 'On garde le moment, sans le nommer.',
  wordlessHint: 'Ne pas trouver le mot est une réponse valable.',
  intensityTitle: 'Force',
  intensityAnchorMin: 'à peine', intensityAnchorMax: 'au maximum',
  contextTitle: 'En lien avec',
  contextOtherBtn: 'Autre', contextOtherPlaceholder: 'En lien avec quoi ?',
  notesTitle: 'Qu’est-ce qui s’est passé ?', notesPlaceholder: 'Écrivez…',
  continueBtn: 'Continuer', saveBtn: 'Enregistrer', validateHereBtn: 'Je ne sais pas',
  validateHereKeep: (label: string) => `on garde « ${label} »`,
  skipBtn: 'Je ne sais pas trop', stopHint: 'S’arrêter à la famille est déjà une réponse.',
  cancel: 'Annuler', back: 'Retour', delete: 'Supprimer',
  infoBtn: 'À propos', entryMenuBtn: 'Options', editReminderBtn: 'Modifier',
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
  primaryLabel: 'Joie', secondaryLabel: 'Sérénité · Calme', intensityLabel: '4/5',
  contextLabels: ['Travail'], notes: 'au lever', dateLabel: '09:36',
}

// Le parent fournit les groupes déjà titrés : le primitive ne calcule aucune date.
const SECTIONS: TreeSelectorEntrySection[] = [{ title: 'AUJOURD’HUI', entries: [ENTRY] }]

interface Overrides {
  sections?: TreeSelectorEntrySection[]
  config?: TreeSelectorConfig
  texts?: TreeSelectorTexts
  loading?: boolean
  saving?: boolean
  nextReminderLabel?: string | null
  onSubmit?: (r: TreeSelectorSubmit) => Promise<void>
  onOpenEntryMenu?: (id: string) => void
  onOpenInfo?: () => void
  onEditReminder?: () => void
  editRequest?: TreeSelectorEditRequest | null
  allowWordless?: boolean
}

function renderTree(over: Overrides = {}) {
  return renderTreeRaw(over)
}

/** Variante exposant `rerender`, pour tester une nouvelle demande de modification. */
function renderTreeRaw(over: Overrides = {}) {
  const onSubmit = over.onSubmit ?? jest.fn().mockResolvedValue(undefined)
  const onOpenEntryMenu = over.onOpenEntryMenu ?? jest.fn()
  const tree = (o: Overrides) => (
    <TreeSelector
      nodes={NODES}
      sections={o.sections ?? []}
      config={o.config ?? makeConfig()}
      texts={o.texts ?? BASE_TEXTS}
      loading={o.loading ?? false}
      saving={o.saving ?? false}
      nextReminderLabel={o.nextReminderLabel}
      onSubmit={onSubmit}
      onOpenEntryMenu={onOpenEntryMenu}
      editRequest={o.editRequest}
      onOpenInfo={o.onOpenInfo}
      onEditReminder={o.onEditReminder}
      allowWordless={o.allowWordless}
    />
  )
  const view = render(tree(over))
  return {
    onSubmit,
    onOpenEntryMenu,
    rerender: (next: Overrides) => view.rerender(tree({ ...over, ...next })),
  }
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
  })

  it('rend les entrées passées + chips de contexte', () => {
    renderTree({ sections: SECTIONS })
    expect(screen.getByTestId('entry-card-sel-1')).toBeTruthy()
    expect(screen.getByTestId('chips-sel-1')).toBeTruthy()
  })

  // ── Accueil : historique groupé par jour (K-3, ticket #251) ───────────────

  it('groupe l\'historique sous les en-têtes fournis par le parent', () => {
    renderTree({ sections: SECTIONS })
    expect(screen.getByTestId('day-AUJOURD’HUI')).toBeTruthy()
    expect(screen.getByText('AUJOURD’HUI')).toBeTruthy()
  })

  it('le groupement n\'affiche aucun total, moyenne ni comparaison', () => {
    renderTree({ sections: SECTIONS })
    const header = screen.getByTestId('day-AUJOURD’HUI')
    // Un en-tête de jour porte son seul libellé : pas de « (2) », pas de moyenne.
    expect(header.props.children).toBeTruthy()
    expect(screen.queryByText(/moyenne|total|\(\d+\)/i)).toBeNull()
  })

  it('ouvre le menu d\'une entrée au tap sur ⋯', () => {
    const onOpenEntryMenu = jest.fn()
    renderTree({ sections: SECTIONS, onOpenEntryMenu })
    fireEvent.press(screen.getByTestId('menu-sel-1'))
    expect(onOpenEntryMenu).toHaveBeenCalledWith('sel-1')
  })

  it('n\'affiche plus le bandeau de psychoéducation ni le disclaimer en pied', () => {
    renderTree({ sections: SECTIONS })
    // Tout est passé dans la fiche ⓘ (K-3).
    expect(screen.queryByTestId('intro-card')).toBeNull()
  })

  it('n\'affiche l\'icône ⓘ que si une fiche est fournie', () => {
    renderTree({ sections: SECTIONS })
    expect(screen.queryByTestId('open-info')).toBeNull()
    const onOpenInfo = jest.fn()
    screen.unmount()
    renderTree({ sections: SECTIONS, onOpenInfo })
    fireEvent.press(screen.getByTestId('open-info'))
    expect(onOpenInfo).toHaveBeenCalledTimes(1)
  })

  it('n\'affiche la ligne de rappel que si un rappel est programmé', () => {
    renderTree({ sections: SECTIONS })
    expect(screen.queryByTestId('next-reminder')).toBeNull()
    screen.unmount()
    const onEditReminder = jest.fn()
    renderTree({ sections: SECTIONS, nextReminderLabel: 'Prochain rappel : aujourd’hui 18:00', onEditReminder })
    expect(screen.getByText('Prochain rappel : aujourd’hui 18:00')).toBeTruthy()
    fireEvent.press(screen.getByTestId('edit-reminder'))
    expect(onEditReminder).toHaveBeenCalledTimes(1)
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
      editingId: null,
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
      editingId: null,
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

  // ── Modification d'une entrée (K-8, ticket #256) ──────────────────────────

  const EDIT_REQUEST = {
    id: 'sel-1',
    wasWordless: false,
    intensity: 3,
    context: ['ctx.work'],
    contextOther: 'trajet',
    notes: 'texte d’origine',
    token: 1,
  }

  it('une demande de modification rouvre le parcours à l\'étape 1', () => {
    renderTree({ editRequest: EDIT_REQUEST })
    // On repart du choix de la famille : c'est ce qui permet de corriger l'émotion.
    expect(screen.getByTestId('level-1-grid')).toBeTruthy()
    expect(screen.queryByTestId('list-empty')).toBeNull()
  })

  it('la modification conserve l\'identifiant de l\'entrée', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    const config = makeConfig({ enableIntensity: false, enableNotes: false })
    renderTree({ config, onSubmit, editRequest: EDIT_REQUEST })
    fireEvent.press(screen.getByTestId('node-joy'))
    await act(async () => { fireEvent.press(screen.getByTestId('node-joy.calm')) })
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ editingId: 'sel-1' }))
  })

  it('les champs facultatifs sont rechargés : on ne fait pas ressaisir l\'inchangé', () => {
    const config = makeConfig({
      enableContext: true,
      contextOptions: [{ code: 'ctx.work', label: 'Travail', icon: 'briefcase-outline' }],
    })
    renderTree({ config, editRequest: EDIT_REQUEST })
    fireEvent.press(screen.getByTestId('node-joy'))
    fireEvent.press(screen.getByTestId('node-joy.calm'))   // nuance sans mots : va à la fiche
    expect(screen.getByTestId('notes-input').props.value).toBe('texte d’origine')
    expect(screen.getByTestId('intensity-btn-3').props.accessibilityState).toEqual({ selected: true })
    // Le contexte libre est rouvert avec sa saisie.
    expect(screen.getByTestId('context-other-input').props.value).toBe('trajet')
  })

  it('une entrée sans mot peut recevoir une émotion par modification', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    const config = makeConfig({ enableIntensity: false, enableNotes: false })
    renderTree({
      config, onSubmit, allowWordless: true,
      editRequest: { ...EDIT_REQUEST, wasWordless: true, intensity: null, contextOther: '' },
    })
    expect(screen.getByTestId('level-1-grid')).toBeTruthy()
    fireEvent.press(screen.getByTestId('node-joy'))
    await act(async () => { fireEvent.press(screen.getByTestId('node-joy.calm')) })
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      editingId: 'sel-1', pathIds: ['joy', 'joy.calm'],
    }))
  })

  it('une entrée sans mot rouverte peut être réenregistrée telle quelle', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    const config = makeConfig({ enableIntensity: false, enableNotes: true })
    renderTree({
      config, onSubmit, allowWordless: true,
      editRequest: { ...EDIT_REQUEST, wasWordless: true, contextOther: '' },
    })
    fireEvent.press(screen.getByTestId('skip-emotion'))
    await act(async () => { fireEvent.press(screen.getByTestId('save-entry')) })
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      editingId: 'sel-1', pathIds: [],
    }))
  })

  it('rouvrir deux fois la même entrée relance le parcours', () => {
    const { rerender } = renderTreeRaw({ editRequest: EDIT_REQUEST })
    fireEvent.press(screen.getByTestId('node-joy'))
    expect(screen.getByTestId('level-2-list')).toBeTruthy()
    // Même entrée, jeton incrémenté : le parcours doit repartir de l'étape 1.
    rerender({ editRequest: { ...EDIT_REQUEST, token: 2 } })
    expect(screen.getByTestId('level-1-grid')).toBeTruthy()
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

  it('n\'affiche la sortie « Je ne sais pas trop » que si allowWordless est actif', () => {
    renderTree()
    fireEvent.press(screen.getByTestId('start-new-button'))
    // Sans autorisation : pas de porte de sortie, donc pas de bouton mort.
    expect(screen.queryByTestId('skip-emotion')).toBeNull()
  })

  it('rappelle qu\'on peut s\'arrêter à la famille', () => {
    renderTree({ allowWordless: true })
    fireEvent.press(screen.getByTestId('start-new-button'))
    expect(screen.getByText('S’arrêter à la famille est déjà une réponse.')).toBeTruthy()
    expect(screen.getByTestId('skip-emotion')).toBeTruthy()
  })

  it('la sortie n\'apparaît qu\'au niveau 1', () => {
    renderTree({ allowWordless: true })
    fireEvent.press(screen.getByTestId('start-new-button'))
    fireEvent.press(screen.getByTestId('node-joy'))
    expect(screen.queryByTestId('skip-emotion')).toBeNull()
  })

  // ── Entrée sans émotion nommée (K-7, ticket #255) ──────────────────────────

  it('« Je ne sais pas trop » ouvre la fiche sans émotion sélectionnée', () => {
    renderTree({ allowWordless: true })
    fireEvent.press(screen.getByTestId('start-new-button'))
    fireEvent.press(screen.getByTestId('skip-emotion'))
    expect(screen.getByTestId('wordless-header')).toBeTruthy()
    expect(screen.getByText('On garde le moment, sans le nommer.')).toBeTruthy()
    // Les mêmes champs que la fiche normale restent disponibles.
    expect(screen.getByTestId('intensity-section')).toBeTruthy()
    expect(screen.getByTestId('notes-input')).toBeTruthy()
  })

  it('aucun message ne présente l\'absence de mot comme un échec', () => {
    renderTree({ allowWordless: true })
    fireEvent.press(screen.getByTestId('start-new-button'))
    fireEvent.press(screen.getByTestId('skip-emotion'))
    expect(screen.getByText('Ne pas trouver le mot est une réponse valable.')).toBeTruthy()
    // Le titre de la fiche « normale » ne s'affiche pas à la place.
    expect(screen.queryByText('Vous pouvez enregistrer, ou préciser.')).toBeNull()
  })

  it('enregistre une entrée sans mot : chemin vide, note conservée', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    renderTree({ allowWordless: true, onSubmit })
    fireEvent.press(screen.getByTestId('start-new-button'))
    fireEvent.press(screen.getByTestId('skip-emotion'))
    fireEvent.changeText(screen.getByTestId('notes-input'), 'réveil difficile')
    await act(async () => { fireEvent.press(screen.getByTestId('save-entry')) })
    expect(onSubmit).toHaveBeenCalledWith({
      editingId: null,
      pathIds: [], intensity: null, context: [], contextOther: '', notes: 'réveil difficile',
    })
  })

  it('un chemin vide reste refusé hors de la sortie « sans mot »', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    renderTree({ onSubmit })
    fireEvent.press(screen.getByTestId('start-new-button'))
    // Retour depuis le niveau 1 : on quitte la saisie, rien n'est soumis.
    fireEvent.press(screen.getByTestId('back-button'))
    expect(onSubmit).not.toHaveBeenCalled()
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
      editingId: null,
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
      editingId: null,
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
      editingId: null,
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

})
