import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { TreeSelector } from './TreeSelector'
import type { TreeSelectorConfig, TreeSelectorNode, TreeSelectorTexts } from './types'

// ─── Données de test (primitive isolé — aucun moteur de modules, aucune i18n) ──

const NODES: TreeSelectorNode[] = [
  {
    id: 'joy', label: 'Joie', color: '#F59E0B', emoji: '😊',
    children: [
      {
        id: 'joy.plaisir', label: 'Plaisir',
        children: [{ id: 'joy.plaisir.rejoui', label: 'Réjoui', children: [] }],
      },
    ],
  },
  { id: 'fear', label: 'Peur', color: '#8B5CF6', emoji: '😨', children: [] },
]

const TEXTS: TreeSelectorTexts = {
  newBtn: 'Identifier', intro: 'Choisissez', historyLabel: 'Historique',
  emptyTitle: 'Rien', emptyText: 'Commencez', intensityTitle: 'Intensité',
  intensityHint: 'De 1 à 10', contextTitle: 'Contexte', contextHint: 'Optionnel',
  notesTitle: 'Notes', notesHint: 'Libre', notesPlaceholder: 'Écrivez…',
  continueBtn: 'Continuer', saveBtn: 'Enregistrer', validateHereBtn: 'Valider ici',
  cancel: 'Annuler', back: 'Retour',
  stepTitles: { 1: 'Émotion principale', 3: 'Émotion spécifique' },
  stepHints: { 1: 'Indice 1', 2: 'Indice 2', 3: 'Indice 3' },
}

function makeConfig(over: Partial<TreeSelectorConfig> = {}): TreeSelectorConfig {
  return {
    enableIntensity: true, enableNotes: true, enableContext: true,
    enableEarlyValidate: true, intensityMax: 10, midIntensity: 5,
    intensityValues: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    contextOptions: [
      { code: 'ctx.work', label: 'Travail' },
      { code: 'ctx.family', label: 'Famille' },
    ],
    ...over,
  }
}

function renderTree(config = makeConfig(), onSubmit?: (r: unknown) => void) {
  return render(
    <TreeSelector
      nodes={NODES}
      config={config}
      texts={TEXTS}
      footerText="Sources : Plutchik (1980)"
      onSubmit={onSubmit as never}
    />
  )
}

describe('ui/TreeSelector web (primitive)', () => {
  it('historique : intro, bouton, état vide, footer', () => {
    const { container } = renderTree()
    expect(screen.getByText('Choisissez')).toBeTruthy()
    expect(screen.getByText('Identifier')).toBeTruthy()
    expect(container.querySelector('.ts-history-empty')).toBeTruthy()
    expect(screen.getByText('Sources : Plutchik (1980)')).toBeTruthy()
  })

  it('démarre le flux : grille des familles (emoji + couleur)', () => {
    const { container } = renderTree()
    fireEvent.click(screen.getByText('Identifier'))
    expect(container.querySelectorAll('.ts-primary')).toHaveLength(2)
    expect(screen.getByText('😊')).toBeTruthy()
    expect(screen.getByText('Joie')).toBeTruthy()
  })

  it('descend dans l\'arbre : famille → nuance', () => {
    const { container } = renderTree()
    fireEvent.click(screen.getByText('Identifier'))
    fireEvent.click(screen.getByText('Joie'))
    expect(container.querySelectorAll('.ts-option').length).toBeGreaterThan(0)
    expect(screen.getByText('Plaisir')).toBeTruthy()
  })

  it('profondeur libre : « valider ici » mène à l\'intensité', () => {
    const { container } = renderTree()
    fireEvent.click(screen.getByText('Identifier'))
    fireEvent.click(screen.getByText('Joie'))
    const validate = container.querySelector('.ts-validate')
    expect(validate).toBeTruthy()
    fireEvent.click(validate as Element)
    expect(container.querySelector('.ts-intensity')).toBeTruthy()
  })

  it('flux complet : feuille → intensité → contexte (chips)', () => {
    const { container } = renderTree()
    fireEvent.click(screen.getByText('Identifier'))
    fireEvent.click(screen.getByText('Joie'))
    fireEvent.click(screen.getByText('Plaisir'))
    fireEvent.click(screen.getByText('Réjoui'))
    expect(container.querySelector('.ts-intensity')).toBeTruthy()
    fireEvent.click(container.querySelector('.ts-continue') as Element)
    expect(container.querySelectorAll('.ts-chip')).toHaveLength(2)
  })

  it('notifie onSubmit avec pathIds + contexte à l\'enregistrement', () => {
    const onSubmit = vi.fn()
    const config = makeConfig({ enableIntensity: false, enableNotes: false })
    renderTree(config, onSubmit)
    fireEvent.click(screen.getByText('Identifier'))
    fireEvent.click(screen.getByText('Peur')) // feuille directe
    // intensité désactivée → passe direct au contexte
    fireEvent.click(screen.getByText('Travail'))
    fireEvent.click(screen.getByText('Continuer'))
    expect(onSubmit).toHaveBeenCalledWith({
      pathIds: ['fear'], intensity: null, context: ['ctx.work'], notes: '',
    })
  })
})
