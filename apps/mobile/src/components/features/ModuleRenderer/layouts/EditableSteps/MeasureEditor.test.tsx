jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons')

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { MeasureEditor } from './MeasureEditor'
import type { PlanItem } from '@services/planItemService'

const OTHER = 'modules.crisis_plan.measure_verb_other'

// Le jeu de propositions est FIXE et vient de la config : il n'est jamais réordonné,
// filtré ni complété selon les saisies passées.
const VERBS = [
  { code: 'v.entrust', label: 'Confier à quelqu\'un' },
  { code: 'v.lock', label: 'Mettre sous clé' },
  { code: 'v.away', label: 'M\'éloigner un temps' },
  { code: OTHER, label: 'Autre' },
]

const LABELS = {
  what: 'Quoi', who: 'Qui s\'en occupe', whoOptional: 'facultatif', until: 'Jusqu\'à quand',
  add: 'Ajouter', cancel: 'Annuler',
  temporaryNote: 'Ces mesures sont temporaires. Elles servent à me donner du temps quand ça va mal.',
  delete: 'Supprimer',
}

function measure(over: Partial<PlanItem>): PlanItem {
  return {
    id: over.id ?? 'm1', module_id: 'crisis_plan', section_id: 'step_6',
    text: over.text ?? 'Ma mère garde la boîte', sort_order: 0, weight: null,
    phone: null, contact_source: null,
    role: over.role ?? null, note: over.note ?? null, created_at: '',
  }
}

function renderEditor(over: { measures?: PlanItem[]; onAdd?: jest.Mock; onDelete?: jest.Mock } = {}) {
  const onAdd = over.onAdd ?? jest.fn()
  const onDelete = over.onDelete ?? jest.fn()
  render(
    <MeasureEditor
      measures={over.measures ?? []}
      verbs={VERBS}
      otherVerbCode={OTHER}
      labels={LABELS}
      onAdd={onAdd}
      onDelete={onDelete}
    />,
  )
  return { onAdd, onDelete }
}

describe('MeasureEditor — les mesures déjà décidées', () => {
  // On voit l'accord existant AVANT d'en ajouter un autre : c'est l'ordre de l'écran.
  it('rend les mesures existantes sous forme de phrases', () => {
    renderEditor({ measures: [measure({ text: 'garde la boîte', role: 'Ma mère', note: 'Jusqu\'au 12 septembre' })] })
    expect(screen.getByText('Ma mère garde la boîte. · Jusqu\'au 12 septembre.')).toBeTruthy()
  })

  it('rend une mesure sans tiers ni échéance, sans trou dans la phrase', () => {
    renderEditor({ measures: [measure({ text: 'M\'éloigner un temps de la maison' })] })
    expect(screen.getByText('M\'éloigner un temps de la maison.')).toBeTruthy()
  })

  it('supprime une mesure', () => {
    const { onDelete } = renderEditor({ measures: [measure({ id: 'm7' })] })
    fireEvent.press(screen.getByTestId('measure-m7-delete'))
    expect(onDelete).toHaveBeenCalledWith(expect.objectContaining({ id: 'm7' }))
  })
})

describe('MeasureEditor — le formulaire', () => {
  it('propose les verbes de la config, dans leur ordre', () => {
    renderEditor()
    for (const v of VERBS) expect(screen.getByTestId(`measure-verb-${v.code}`)).toBeTruthy()
  })

  it('ajoute une mesure complète', () => {
    const { onAdd } = renderEditor()
    fireEvent.press(screen.getByTestId('measure-verb-v.entrust'))
    fireEvent.changeText(screen.getByTestId('measure-what'), 'le trousseau')
    fireEvent.changeText(screen.getByTestId('measure-who'), 'Ma sœur')
    fireEvent.changeText(screen.getByTestId('measure-until'), 'Jusqu\'à mon prochain rendez-vous')
    fireEvent.press(screen.getByTestId('measure-add'))

    expect(onAdd).toHaveBeenCalledWith({
      verb: 'Confier à quelqu\'un', what: 'le trousseau',
      who: 'Ma sœur', until: 'Jusqu\'à mon prochain rendez-vous',
    })
  })

  // S'éloigner n'implique personne d'autre : un champ obligatoire aurait bloqué ce cas.
  it('ajoute une mesure sans « qui s\'en occupe » ni échéance', () => {
    const { onAdd } = renderEditor()
    fireEvent.press(screen.getByTestId('measure-verb-v.away'))
    fireEvent.changeText(screen.getByTestId('measure-what'), 'de la maison')
    fireEvent.press(screen.getByTestId('measure-add'))
    expect(onAdd).toHaveBeenCalledWith({
      verb: 'M\'éloigner un temps', what: 'de la maison', who: null, until: null,
    })
  })

  it('« Autre » ouvre un champ libre pour le verbe', () => {
    const { onAdd } = renderEditor()
    expect(screen.queryByTestId('measure-verb-free')).toBeNull()
    fireEvent.press(screen.getByTestId(`measure-verb-${OTHER}`))
    fireEvent.changeText(screen.getByTestId('measure-verb-free'), 'Laisser chez ma voisine')
    fireEvent.changeText(screen.getByTestId('measure-what'), 'le double des clés')
    fireEvent.press(screen.getByTestId('measure-add'))
    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ verb: 'Laisser chez ma voisine' }))
  })

  it('n\'ajoute rien sans verbe ou sans quoi', () => {
    const { onAdd } = renderEditor()
    fireEvent.press(screen.getByTestId('measure-add'))
    expect(onAdd).not.toHaveBeenCalled()

    fireEvent.press(screen.getByTestId('measure-verb-v.lock'))
    fireEvent.press(screen.getByTestId('measure-add'))
    expect(onAdd).not.toHaveBeenCalled()
  })

  it('vide le formulaire après un ajout, et à l\'annulation', () => {
    const { onAdd } = renderEditor()
    fireEvent.press(screen.getByTestId('measure-verb-v.lock'))
    fireEvent.changeText(screen.getByTestId('measure-what'), 'la boîte')
    fireEvent.press(screen.getByTestId('measure-add'))
    expect(onAdd).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('measure-what').props.value).toBe('')

    fireEvent.changeText(screen.getByTestId('measure-what'), 'autre chose')
    fireEvent.press(screen.getByTestId('measure-cancel'))
    expect(screen.getByTestId('measure-what').props.value).toBe('')
  })

  it('affiche la mention persistante sur le caractère temporaire', () => {
    renderEditor()
    expect(screen.getByText(LABELS.temporaryNote)).toBeTruthy()
  })
})

describe('MeasureEditor — invariants MDR', () => {
  const source = require('fs').readFileSync(require('path').join(__dirname, 'MeasureEditor.tsx'), 'utf-8')

  // L'interface ne nomme, ne liste, ne suggère et n'illustre jamais un moyen : aucun
  // placeholder ne donne d'exemple d'objet.
  it('ne pose aucun placeholder sur les champs', () => {
    renderEditor()
    for (const id of ['measure-what', 'measure-who', 'measure-until']) {
      expect(screen.getByTestId(id).props.placeholder).toBeUndefined()
    }
  })

  // L'échéance est affichée, jamais surveillée : faire dire à l'app « cette mesure a
  // expiré » serait du contenu piloté par une donnée patient.
  it('ne compare aucune date à aujourd\'hui', () => {
    expect(source).not.toMatch(/Date\.now\(\)|new Date\(\)/)
  })
})
