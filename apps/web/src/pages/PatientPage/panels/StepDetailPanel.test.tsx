import { vi, describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { readStepColumns } from '@kaer/shared'
import { StepDetailPanel } from './StepDetailPanel'
import type { SafetyPlanItem } from '@services/safetyPlanItemsService'

const COLUMN_LABELS = {
  text: 'Dans ses mots',
  kind: 'Personne ou lieu',
  role: 'Lien ou fonction',
  phone: 'Téléphone',
  note: 'À noter',
  actions: 'Actions',
  noPhone: 'aucun numéro',
  moveUp: 'Monter',
  moveDown: 'Descendre',
  delete: 'Supprimer',
}

const FORM_LABELS = {
  title: 'Ajouter à cette étape',
  text: 'Dans ses mots',
  role: 'Lien ou fonction',
  phone: 'Téléphone',
  note: 'À noter',
  optional: 'facultatif',
  add: 'Ajouter',
  cancel: 'Annuler',
  patientCanEdit: 'Le patient pourra modifier depuis son téléphone.',
}

const KIND_OPTIONS = [
  { value: 'person' as const, label: 'une personne' },
  { value: 'place' as const, label: 'un lieu' },
]

function item(over: Partial<SafetyPlanItem>): SafetyPlanItem {
  return {
    id: over.id ?? 'i1',
    section_id: over.section_id ?? 'step_4',
    text: over.text ?? 'Yasmine',
    kind: over.kind ?? null,
    role: over.role ?? null,
    note: over.note ?? null,
    phone: over.phone ?? null,
    sort_order: over.sort_order ?? 0,
    authored_by: 'practitioner',
    created_at: '', updated_at: '',
  }
}

function renderPanel(over: Partial<React.ComponentProps<typeof StepDetailPanel>> = {}) {
  const props: React.ComponentProps<typeof StepDetailPanel> = {
    stepLabel: 'Les proches que je peux appeler',
    columns: readStepColumns({ contactable: 'true' }),
    items: [item({})],
    kindOptions: KIND_OPTIONS,
    columnLabels: COLUMN_LABELS,
    formLabels: FORM_LABELS,
    emptyLabel: 'Cette étape n\'a rien pour l\'instant.',
    tableLabel: 'Ce que contient cette étape',
    onPatch: vi.fn(),
    onMove: vi.fn(),
    onDelete: vi.fn(),
    onAdd: vi.fn(),
    ...over,
  }
  render(<StepDetailPanel {...props} />)
  return props
}

function headers(): string[] {
  return screen.getAllByRole('columnheader').map(th => th.textContent ?? '')
}

beforeEach(() => vi.clearAllMocks())

// ── Les cinq configurations de colonnes du ticket #322 ─────────────────────
// Chacune est décrite par la CONFIGURATION de l'étape, jamais par son numéro.
describe('StepDetailPanel : colonnes selon l\'étape', () => {
  it('étapes 1 et 2 (texte seul) : ni nature, ni lien, ni téléphone, ni note', () => {
    renderPanel({ columns: readStepColumns({ step_number: '1' }) })
    expect(headers()).toEqual([COLUMN_LABELS.text, COLUMN_LABELS.actions])
  })

  it('étape 3 (personnes et lieux mêlés) : la nature s\'ajoute', () => {
    renderPanel({ columns: readStepColumns({ mixed_kind: 'true' }) })
    expect(headers()).toEqual([
      COLUMN_LABELS.text, COLUMN_LABELS.kind, COLUMN_LABELS.role,
      COLUMN_LABELS.phone, COLUMN_LABELS.note, COLUMN_LABELS.actions,
    ])
  })

  it('étape 4 (les proches) : lien, téléphone et note, sans colonne de nature', () => {
    renderPanel({ columns: readStepColumns({ contactable: 'true' }) })
    expect(headers()).toEqual([
      COLUMN_LABELS.text, COLUMN_LABELS.role,
      COLUMN_LABELS.phone, COLUMN_LABELS.note, COLUMN_LABELS.actions,
    ])
  })

  it('étape 5 (les professionnels) : mêmes colonnes que les proches', () => {
    renderPanel({ columns: readStepColumns({ contactable: 'true', step_number: '5' }) })
    expect(headers()).toEqual([
      COLUMN_LABELS.text, COLUMN_LABELS.role,
      COLUMN_LABELS.phone, COLUMN_LABELS.note, COLUMN_LABELS.actions,
    ])
  })

  it('étape 6 (les arrangements) : aucune colonne de précision, elle a son éditeur', () => {
    renderPanel({ columns: readStepColumns({ measure_editor: 'true' }) })
    expect(headers()).toEqual([COLUMN_LABELS.text, COLUMN_LABELS.actions])
  })
})

describe('StepDetailPanel : items', () => {
  it('rend un item ancien, sans kind ni role ni note, sans rien casser', () => {
    renderPanel({ columns: readStepColumns({ mixed_kind: 'true' }), items: [item({ id: 'old' })] })
    expect(screen.getByDisplayValue('Yasmine')).toBeTruthy()
    // Aucune nature n'est présélectionnée : rien n'est déduit du texte de l'item.
    for (const segment of screen.getAllByRole('radio')) {
      expect(segment).toHaveAttribute('aria-checked', 'false')
    }
  })

  // Un item sans numéro n'est PAS une erreur : mention neutre, jamais de rouge, et elle
  // dit la conséquence côté patient.
  it('signale l\'absence de numéro par une mention neutre, sans bloquer', () => {
    renderPanel({ items: [item({ phone: null })] })
    const mention = screen.getByText(COLUMN_LABELS.noPhone)
    expect(mention.className).toContain('plan-editor__item-note')
    expect(mention.className).not.toMatch(/error|danger|warning/)
  })

  it('n\'affiche aucune mention quand l\'item porte un numéro', () => {
    renderPanel({ items: [item({ phone: '0600000000' })] })
    expect(screen.queryByText(COLUMN_LABELS.noPhone)).toBeNull()
  })

  it('remonte la modification d\'une cellule à la sortie du champ', () => {
    const props = renderPanel({ items: [item({ id: 'x', role: null })] })
    const cell = screen.getByLabelText(COLUMN_LABELS.role)
    fireEvent.change(cell, { target: { value: 'ma voisine' } })
    fireEvent.blur(cell)
    expect(props.onPatch).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'x' }), { role: 'ma voisine' },
    )
  })

  it('ne réécrit rien quand la valeur n\'a pas changé', () => {
    const props = renderPanel({ items: [item({ id: 'x', role: 'ma voisine' })] })
    fireEvent.blur(screen.getByLabelText(COLUMN_LABELS.role))
    expect(props.onPatch).not.toHaveBeenCalled()
  })

  it('choisir la nature d\'un item la remonte telle quelle', () => {
    const props = renderPanel({
      columns: readStepColumns({ mixed_kind: 'true' }),
      items: [item({ id: 'x' })],
    })
    fireEvent.click(screen.getByText('un lieu'))
    expect(props.onPatch).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'x' }), { kind: 'place' },
    )
  })

  it('supprime un item par son bouton, nommé pour être compris hors contexte', () => {
    const props = renderPanel({ items: [item({ id: 'x', text: 'Thomas' })] })
    fireEvent.click(screen.getByLabelText('Supprimer : Thomas'))
    expect(props.onDelete).toHaveBeenCalledWith(expect.objectContaining({ id: 'x' }))
  })
})

describe('StepDetailPanel : réordonnancement', () => {
  const two = [item({ id: 'a', text: 'Yasmine' }), item({ id: 'b', text: 'Thomas', sort_order: 1 })]

  it('borne les déplacements : le premier ne monte pas, le dernier ne descend pas', () => {
    renderPanel({ items: two })
    expect(screen.getByLabelText('Monter : Yasmine')).toBeDisabled()
    expect(screen.getByLabelText('Descendre : Thomas')).toBeDisabled()
    expect(screen.getByLabelText('Descendre : Yasmine')).not.toBeDisabled()
  })

  it('remonte le sens du déplacement demandé', () => {
    const props = renderPanel({ items: two })
    fireEvent.click(screen.getByLabelText('Monter : Thomas'))
    expect(props.onMove).toHaveBeenCalledWith(expect.objectContaining({ id: 'b' }), 'up')
  })
})

describe('StepDetailPanel : formulaire d\'ajout', () => {
  it('n\'exige que le texte : un item sans numéro s\'ajoute', () => {
    const props = renderPanel()
    fireEvent.change(screen.getByTestId('plan-item-text'), { target: { value: 'Claire' } })
    fireEvent.click(screen.getByText(FORM_LABELS.add))
    expect(props.onAdd).toHaveBeenCalledWith({ text: 'Claire', role: null, phone: null, note: null })
  })

  it('n\'ajoute rien sans texte, sans afficher d\'erreur', () => {
    const props = renderPanel()
    fireEvent.click(screen.getByText(FORM_LABELS.add))
    expect(props.onAdd).not.toHaveBeenCalled()
  })

  it('n\'affiche que les champs des colonnes de l\'étape', () => {
    renderPanel({ columns: readStepColumns({ step_number: '1' }) })
    expect(screen.getByTestId('plan-item-text')).toBeTruthy()
    expect(screen.queryByTestId('plan-item-role')).toBeNull()
    expect(screen.queryByTestId('plan-item-phone')).toBeNull()
  })

  it('vide les champs après un ajout', () => {
    renderPanel()
    const text = screen.getByTestId('plan-item-text')
    fireEvent.change(text, { target: { value: 'Claire' } })
    fireEvent.click(screen.getByText(FORM_LABELS.add))
    expect(text).toHaveValue('')
  })

  // Aucune bibliothèque de suggestions à cocher : un item doit être dans les mots du
  // patient, c'est la condition pour qu'il le retrouve en crise.
  it('ne propose aucune suggestion pré-remplie', () => {
    renderPanel()
    expect(screen.getByTestId('plan-item-text')).toHaveValue('')
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0)
  })
})

describe('StepDetailPanel : étape vide', () => {
  it('dit qu\'elle est vide sur un ton neutre, et laisse le formulaire ouvert', () => {
    renderPanel({ items: [] })
    expect(screen.getByText('Cette étape n\'a rien pour l\'instant.')).toBeTruthy()
    expect(screen.getByTestId('plan-item-text')).toBeTruthy()
  })

  it('n\'affiche aucun pourcentage ni score', () => {
    const { container } = render(
      <StepDetailPanel
        stepLabel="Les proches"
        columns={readStepColumns({ contactable: 'true' })}
        items={[item({}), item({ id: 'i2', sort_order: 1 })]}
        kindOptions={KIND_OPTIONS}
        columnLabels={COLUMN_LABELS}
        formLabels={FORM_LABELS}
        emptyLabel="vide"
        tableLabel="table"
        onPatch={vi.fn()} onMove={vi.fn()} onDelete={vi.fn()} onAdd={vi.fn()}
      />,
    )
    expect(within(container).queryByText(/%/)).toBeNull()
  })
})
