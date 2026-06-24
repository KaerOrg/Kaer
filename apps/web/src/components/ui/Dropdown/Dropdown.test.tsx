import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Dropdown } from './Dropdown'
import type { DropdownOption } from './Dropdown.types'

const options: DropdownOption[] = [
  { value: 'anxiety', label: 'Anxiété', group: 'indication' },
  { value: 'ocd', label: 'TOC', group: 'indication' },
  { value: 'teen', label: 'Adolescent', group: 'population' },
]
const groupLabels = { indication: 'Indication', population: 'Public' }

beforeEach(() => vi.clearAllMocks())

// ── Mode single ─────────────────────────────────────────────────────────────

describe('Dropdown — mode single', () => {
  function renderSingle(overrides = {}) {
    const onChange = vi.fn()
    render(
      <Dropdown
        label="Trouble"
        value=""
        onChange={onChange}
        options={options}
        groupLabels={groupLabels}
        placeholder="Choisir…"
        {...overrides}
      />,
    )
    return { onChange }
  }

  it('affiche le label associé au champ', () => {
    renderSingle()
    expect(screen.getByText('Trouble')).toBeInTheDocument()
    expect(screen.getByLabelText('Trouble')).toBeInTheDocument()
  })

  it('liste fermée par défaut, ouverte au focus', () => {
    renderSingle()
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    fireEvent.focus(screen.getByRole('combobox'))
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Anxiété' })).toBeInTheDocument()
  })

  it('affiche le libellé de la valeur sélectionnée quand la liste est fermée', () => {
    renderSingle({ value: 'ocd' })
    expect(screen.getByRole('combobox')).toHaveValue('TOC')
  })

  it('appelle onChange avec la valeur et ferme à la sélection', () => {
    const { onChange } = renderSingle()
    fireEvent.focus(screen.getByRole('combobox'))
    fireEvent.pointerDown(screen.getByRole('option', { name: 'TOC' }))
    expect(onChange).toHaveBeenCalledWith('ocd')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('liste ouverte n est pas multi-sélectionnable', () => {
    renderSingle()
    fireEvent.focus(screen.getByRole('combobox'))
    expect(screen.getByRole('listbox')).not.toHaveAttribute('aria-multiselectable', 'true')
  })
})

// ── Autocomplétion ──────────────────────────────────────────────────────────

describe('Dropdown — autocomplétion', () => {
  it('filtre par saisie, insensible casse et accents', () => {
    render(<Dropdown label="Trouble" value="" onChange={vi.fn()} options={options} />)
    const input = screen.getByRole('combobox')
    fireEvent.change(input, { target: { value: 'anxiete' } })
    expect(screen.getByRole('option', { name: 'Anxiété' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'TOC' })).not.toBeInTheDocument()
  })

  it('affiche emptyText quand aucune option ne correspond', () => {
    render(
      <Dropdown label="Trouble" value="" onChange={vi.fn()} options={options} emptyText="Rien" />,
    )
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'zzz' } })
    expect(screen.getByText('Rien')).toBeInTheDocument()
  })

  it('searchable=false rend le champ en lecture seule et n a pas de filtre', () => {
    render(
      <Dropdown label="Trouble" value="" onChange={vi.fn()} options={options} searchable={false} />,
    )
    const input = screen.getByRole('combobox')
    expect(input).toHaveAttribute('readonly')
    fireEvent.click(input)
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    // Toutes les options restent affichées (aucun filtrage).
    expect(screen.getByRole('option', { name: 'Anxiété' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'TOC' })).toBeInTheDocument()
  })
})

// ── Mode multiple ───────────────────────────────────────────────────────────

describe('Dropdown — mode multiple', () => {
  function renderMultiple(selected: ReadonlySet<string> = new Set()) {
    const onToggle = vi.fn()
    render(
      <Dropdown
        mode="multiple"
        ariaLabel="Filtre"
        options={options}
        selectedValues={selected}
        onToggle={onToggle}
        groupLabels={groupLabels}
        placeholder="Filtrer…"
      />,
    )
    return { onToggle }
  }

  it('liste multi-sélectionnable, en-têtes de groupe affichés', () => {
    renderMultiple()
    fireEvent.focus(screen.getByRole('combobox'))
    expect(screen.getByRole('listbox')).toHaveAttribute('aria-multiselectable', 'true')
    expect(screen.getByText('Indication')).toBeInTheDocument()
    expect(screen.getByText('Public')).toBeInTheDocument()
  })

  it('clic sur une option appelle onToggle et garde la liste ouverte', () => {
    const { onToggle } = renderMultiple()
    fireEvent.focus(screen.getByRole('combobox'))
    fireEvent.pointerDown(screen.getByRole('option', { name: 'TOC' }))
    expect(onToggle).toHaveBeenCalledWith('ocd')
    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })

  it('marque les options sélectionnées via aria-selected', () => {
    renderMultiple(new Set(['teen']))
    fireEvent.focus(screen.getByRole('combobox'))
    expect(screen.getByRole('option', { name: 'Adolescent' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('option', { name: 'Anxiété' })).toHaveAttribute('aria-selected', 'false')
  })
})

// ── Navigation clavier ──────────────────────────────────────────────────────

describe('Dropdown — navigation clavier', () => {
  it('flèche bas + Entrée sélectionne l option active', () => {
    const onChange = vi.fn()
    render(<Dropdown label="Trouble" value="" onChange={onChange} options={options} />)
    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onChange).toHaveBeenCalledWith('anxiety')
  })

  it('Échap ferme la liste', () => {
    render(<Dropdown label="Trouble" value="" onChange={vi.fn()} options={options} />)
    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('saute les options désactivées lors de la navigation', () => {
    const onChange = vi.fn()
    const withDisabled: DropdownOption[] = [
      { value: 'a', label: 'A', disabled: true },
      { value: 'b', label: 'B' },
    ]
    render(<Dropdown label="L" value="" onChange={onChange} options={withDisabled} />)
    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onChange).toHaveBeenCalledWith('b')
  })
})

// ── État erreur et désactivé ────────────────────────────────────────────────

describe('Dropdown — erreur et désactivation', () => {
  it('affiche le message d erreur et la classe', () => {
    render(<Dropdown label="L" value="" onChange={vi.fn()} options={options} error="Requis" />)
    expect(screen.getByText('Requis')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toHaveClass('dropdown__input--error')
  })

  it('option désactivée n appelle pas onChange au clic', () => {
    const onChange = vi.fn()
    const withDisabled: DropdownOption[] = [{ value: 'a', label: 'A', disabled: true }]
    render(<Dropdown label="L" value="" onChange={onChange} options={withDisabled} />)
    fireEvent.focus(screen.getByRole('combobox'))
    fireEvent.pointerDown(screen.getByRole('option', { name: 'A' }))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('champ désactivé ne s ouvre pas au focus', () => {
    render(<Dropdown label="L" value="" onChange={vi.fn()} options={options} disabled />)
    fireEvent.focus(screen.getByRole('combobox'))
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
})
