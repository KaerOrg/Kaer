import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MultiSelectAutocomplete } from './MultiSelectAutocomplete'
import type { AutocompleteOption } from './MultiSelectAutocomplete.types'

const options: AutocompleteOption[] = [
  { value: 'anxiety', label: 'Anxiété', group: 'indication' },
  { value: 'ocd', label: 'TOC', group: 'indication' },
  { value: 'teen', label: 'Ado', group: 'population' },
]

const groupLabels = { indication: 'Indication', population: 'Public' }
const onToggle = vi.fn()

function renderAC(selected: ReadonlySet<string> = new Set()) {
  return render(
    <MultiSelectAutocomplete
      options={options}
      selectedValues={selected}
      onToggle={onToggle}
      groupLabels={groupLabels}
      placeholder="Filtrer…"
      emptyText="Aucun résultat"
    />,
  )
}

beforeEach(() => vi.clearAllMocks())

describe('MultiSelectAutocomplete', () => {
  it('liste fermée par défaut, ouverte au focus', () => {
    renderAC()
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    fireEvent.focus(screen.getByRole('combobox'))
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Anxiété' })).toBeInTheDocument()
  })

  it('affiche les en-têtes de groupe', () => {
    renderAC()
    fireEvent.focus(screen.getByRole('combobox'))
    expect(screen.getByText('Indication')).toBeInTheDocument()
    expect(screen.getByText('Public')).toBeInTheDocument()
  })

  it('filtre par saisie, insensible à la casse et aux accents', () => {
    renderAC()
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'anxi' } })
    expect(screen.getByRole('option', { name: 'Anxiété' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'TOC' })).not.toBeInTheDocument()
  })

  it('texte vide quand aucune option ne correspond', () => {
    renderAC()
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'xyz' } })
    expect(screen.getByText('Aucun résultat')).toBeInTheDocument()
  })

  it('clic sur une option appelle onToggle et vide la saisie', () => {
    renderAC()
    const input = screen.getByRole('combobox') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'toc' } })
    fireEvent.pointerDown(screen.getByRole('option', { name: 'TOC' }))
    expect(onToggle).toHaveBeenCalledWith('ocd')
    expect(input.value).toBe('')
  })

  it('marque les options sélectionnées via aria-selected', () => {
    renderAC(new Set(['teen']))
    fireEvent.focus(screen.getByRole('combobox'))
    expect(screen.getByRole('option', { name: 'Ado' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('option', { name: 'Anxiété' })).toHaveAttribute('aria-selected', 'false')
  })

  it('navigation clavier : flèche bas + Entrée bascule l option active', () => {
    renderAC()
    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onToggle).toHaveBeenCalledWith('anxiety')
  })

  it('Échap ferme la liste', () => {
    renderAC()
    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
})
