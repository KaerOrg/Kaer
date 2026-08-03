import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import { SafetyMeasureEditor, type ExistingMeasure } from './SafetyMeasureEditor'

const OTHER = 'modules.crisis_plan.measure_verb_other'

// Le jeu de propositions est FIXE et vient de la configuration : jamais réordonné,
// filtré ni complété selon ce qui a été saisi.
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

function renderEditor(measures: ExistingMeasure[] = []) {
  const onAdd = vi.fn()
  const onDelete = vi.fn()
  render(
    <SafetyMeasureEditor
      measures={measures}
      verbs={VERBS}
      otherVerbCode={OTHER}
      labels={LABELS}
      onAdd={onAdd}
      onDelete={onDelete}
    />,
  )
  return { onAdd, onDelete }
}

describe('SafetyMeasureEditor — les mesures décidées', () => {
  it('rend chaque mesure sous forme de phrase', () => {
    renderEditor([{ id: 'm1', text: 'garde la boîte', role: 'Ma sœur', note: 'Jusqu\'au 12 septembre' }])
    expect(screen.getByText('Ma sœur garde la boîte. · Jusqu\'au 12 septembre.')).toBeInTheDocument()
  })

  // « Qui s'en occupe » est réellement facultatif : son absence ne laisse aucun trou.
  it('rend une mesure sans tiers ni échéance, sans trou', () => {
    renderEditor([{ id: 'm2', text: 'M\'éloigner un temps de la maison', role: null, note: null }])
    expect(screen.getByText('M\'éloigner un temps de la maison.')).toBeInTheDocument()
  })

  it('retire une mesure', () => {
    const { onDelete } = renderEditor([{ id: 'm3', text: 'garde les clés', role: 'Mon frère', note: null }])
    fireEvent.click(screen.getByRole('button', { name: /Supprimer/ }))
    expect(onDelete).toHaveBeenCalledWith('m3')
  })
})

describe('SafetyMeasureEditor — la saisie', () => {
  it('propose les verbes de la configuration, dans leur ordre', () => {
    renderEditor()
    const labels = VERBS.map(v => v.label)
    for (const label of labels) expect(screen.getByText(label)).toBeInTheDocument()
  })

  it('ajoute une mesure complète', () => {
    const { onAdd } = renderEditor()
    fireEvent.click(screen.getByText('Confier à quelqu\'un'))
    fireEvent.change(screen.getByTestId('measure-what'), { target: { value: 'le trousseau' } })
    fireEvent.change(screen.getByTestId('measure-who'), { target: { value: 'Ma sœur' } })
    fireEvent.change(screen.getByTestId('measure-until'), { target: { value: 'Jusqu\'au 12 septembre' } })
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter' }))

    expect(onAdd).toHaveBeenCalledWith({
      verb: 'Confier à quelqu\'un', what: 'le trousseau',
      who: 'Ma sœur', until: 'Jusqu\'au 12 septembre',
    })
  })

  it('ajoute une mesure sans tiers ni échéance', () => {
    const { onAdd } = renderEditor()
    fireEvent.click(screen.getByText('M\'éloigner un temps'))
    fireEvent.change(screen.getByTestId('measure-what'), { target: { value: 'de la maison' } })
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter' }))
    expect(onAdd).toHaveBeenCalledWith({
      verb: 'M\'éloigner un temps', what: 'de la maison', who: null, until: null,
    })
  })

  // Une échéance en mots est une réponse aussi valable qu'une date.
  it('accepte une échéance en texte libre', () => {
    const { onAdd } = renderEditor()
    fireEvent.click(screen.getByText('Mettre sous clé'))
    fireEvent.change(screen.getByTestId('measure-what'), { target: { value: 'la boîte' } })
    fireEvent.change(screen.getByTestId('measure-until'), { target: { value: 'Jusqu\'à notre prochain rendez-vous' } })
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter' }))
    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ until: 'Jusqu\'à notre prochain rendez-vous' }))
  })

  it('« Autre » ouvre un champ libre pour le verbe', () => {
    const { onAdd } = renderEditor()
    expect(screen.queryByTestId('measure-verb-free')).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('Autre'))
    fireEvent.change(screen.getByTestId('measure-verb-free'), { target: { value: 'Laisser chez la voisine' } })
    fireEvent.change(screen.getByTestId('measure-what'), { target: { value: 'le double des clés' } })
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter' }))
    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ verb: 'Laisser chez la voisine' }))
  })

  it('n\'ajoute rien sans verbe ou sans quoi', () => {
    const { onAdd } = renderEditor()
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter' }))
    expect(onAdd).not.toHaveBeenCalled()
    fireEvent.click(screen.getByText('Mettre sous clé'))
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter' }))
    expect(onAdd).not.toHaveBeenCalled()
  })

  it('vide le formulaire après ajout et à l\'annulation', () => {
    renderEditor()
    fireEvent.click(screen.getByText('Mettre sous clé'))
    fireEvent.change(screen.getByTestId('measure-what'), { target: { value: 'la boîte' } })
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter' }))
    expect(screen.getByTestId('measure-what')).toHaveValue('')

    fireEvent.change(screen.getByTestId('measure-what'), { target: { value: 'autre chose' } })
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }))
    expect(screen.getByTestId('measure-what')).toHaveValue('')
  })

  it('affiche la mention persistante sur le caractère temporaire', () => {
    renderEditor()
    expect(screen.getByText(LABELS.temporaryNote)).toBeInTheDocument()
  })
})

describe('SafetyMeasureEditor — invariants MDR', () => {
  const source = readFileSync(join(__dirname, 'SafetyMeasureEditor.tsx'), 'utf-8')

  // L'interface ne nomme, ne liste, ne suggère et n'illustre jamais un moyen.
  it('ne pose aucun placeholder sur les champs', () => {
    renderEditor()
    for (const id of ['measure-what', 'measure-who', 'measure-until']) {
      expect(screen.getByTestId(id)).not.toHaveAttribute('placeholder')
    }
  })

  // La date est affichée, jamais surveillée : aucun rappel, aucune alerte, aucune
  // couleur à l'échéance, ni ici ni dans l'onglet Données.
  it('ne compare aucune date à aujourd\'hui', () => {
    expect(source).not.toMatch(/Date\.now\(\)|new Date\(\)/)
  })
})
