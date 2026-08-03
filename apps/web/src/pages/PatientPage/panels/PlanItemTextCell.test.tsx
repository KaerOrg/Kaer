import { vi, describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PlanItemTextCell } from './PlanItemTextCell'
import type { SafetyPlanItem } from '@services/safetyPlanItemsService'

function item(over: Partial<SafetyPlanItem> = {}): SafetyPlanItem {
  return {
    id: 'i1', section_id: 'step_4', text: 'Yasmine',
    kind: null, role: null, note: null, phone: null,
    sort_order: 0, authored_by: 'practitioner', created_at: '', updated_at: '',
    ...over,
  }
}

beforeEach(() => vi.clearAllMocks())

describe('PlanItemTextCell', () => {
  it('amorce le champ avec la valeur du serveur', () => {
    render(<PlanItemTextCell item={item({ role: 'ma voisine' })} field="role" ariaLabel="Lien" onPatch={vi.fn()} />)
    expect(screen.getByLabelText('Lien')).toHaveValue('ma voisine')
  })

  it('un champ vide côté serveur s\'affiche vide, jamais « null »', () => {
    render(<PlanItemTextCell item={item({ role: null })} field="role" ariaLabel="Lien" onPatch={vi.fn()} />)
    expect(screen.getByLabelText('Lien')).toHaveValue('')
  })

  it('remonte la modification à la sortie du champ, élaguée', () => {
    const onPatch = vi.fn()
    render(<PlanItemTextCell item={item()} field="role" ariaLabel="Lien" onPatch={onPatch} />)
    const input = screen.getByLabelText('Lien')
    fireEvent.change(input, { target: { value: '  ma voisine  ' } })
    fireEvent.blur(input)
    expect(onPatch).toHaveBeenCalledWith(expect.objectContaining({ id: 'i1' }), { role: 'ma voisine' })
  })

  // Traverser un tableau au clavier ne doit pas écrire six fois dans le plan.
  it('n\'écrit rien quand la valeur n\'a pas changé', () => {
    const onPatch = vi.fn()
    render(<PlanItemTextCell item={item({ role: 'ma voisine' })} field="role" ariaLabel="Lien" onPatch={onPatch} />)
    fireEvent.blur(screen.getByLabelText('Lien'))
    expect(onPatch).not.toHaveBeenCalled()
  })

  it('n\'écrit pas deux fois la même valeur sur deux sorties de champ successives', () => {
    const onPatch = vi.fn()
    render(<PlanItemTextCell item={item()} field="role" ariaLabel="Lien" onPatch={onPatch} />)
    const input = screen.getByLabelText('Lien')
    fireEvent.change(input, { target: { value: 'mon frère' } })
    fireEvent.blur(input)
    fireEvent.blur(input)
    expect(onPatch).toHaveBeenCalledTimes(1)
  })

  it('vider une précision la remet à null', () => {
    const onPatch = vi.fn()
    render(<PlanItemTextCell item={item({ phone: '0600000000' })} field="phone" ariaLabel="Téléphone" onPatch={onPatch} />)
    const input = screen.getByLabelText('Téléphone')
    fireEvent.change(input, { target: { value: '' } })
    fireEvent.blur(input)
    expect(onPatch).toHaveBeenCalledWith(expect.objectContaining({ id: 'i1' }), { phone: null })
  })

  // Un item sans texte n'a plus d'existence : l'effacer par une sortie de champ serait
  // une suppression déguisée, sans annulation possible.
  it('vider le texte de l\'item ne l\'efface pas : le champ reprend sa valeur', () => {
    const onPatch = vi.fn()
    render(<PlanItemTextCell item={item({ text: 'Yasmine' })} field="text" ariaLabel="Dans ses mots" onPatch={onPatch} />)
    const input = screen.getByLabelText('Dans ses mots')
    fireEvent.change(input, { target: { value: '   ' } })
    fireEvent.blur(input)
    expect(onPatch).not.toHaveBeenCalled()
    expect(input).toHaveValue('Yasmine')
  })

  it('le texte reste modifiable tant qu\'il n\'est pas vidé', () => {
    const onPatch = vi.fn()
    render(<PlanItemTextCell item={item({ text: 'Yasmine' })} field="text" ariaLabel="Dans ses mots" onPatch={onPatch} />)
    const input = screen.getByLabelText('Dans ses mots')
    fireEvent.change(input, { target: { value: 'Yasmine B.' } })
    fireEvent.blur(input)
    expect(onPatch).toHaveBeenCalledWith(expect.objectContaining({ id: 'i1' }), { text: 'Yasmine B.' })
  })

  // Le plan est co-édité : le patient a pu modifier l'item depuis son téléphone entre
  // deux rendus. Le champ non contrôlé doit repartir de la valeur reçue.
  it('repart de la valeur serveur quand elle change sous lui', () => {
    const { rerender } = render(
      <PlanItemTextCell item={item({ role: 'ma voisine' })} field="role" ariaLabel="Lien" onPatch={vi.fn()} />,
    )
    rerender(<PlanItemTextCell item={item({ role: 'ma soeur' })} field="role" ariaLabel="Lien" onPatch={vi.fn()} />)
    expect(screen.getByLabelText('Lien')).toHaveValue('ma soeur')
  })
})
