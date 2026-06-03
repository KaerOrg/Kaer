import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DataTable } from './DataTable'
import type { DataTableColumn } from './DataTable.types'

interface Person {
  id: string
  name: string
  role: string
}

const PEOPLE: Person[] = [
  { id: '1', name: 'Ada Lovelace', role: 'Pionnière' },
  { id: '2', name: 'Alan Turing', role: 'Logicien' },
]

const COLUMNS: DataTableColumn<Person>[] = [
  { id: 'name', header: 'Nom', cell: row => row.name },
  { id: 'role', header: 'Rôle', cell: row => row.role },
]

describe('DataTable', () => {
  it('affiche les en-têtes et les lignes', () => {
    render(<DataTable columns={COLUMNS} rows={PEOPLE} getRowId={p => p.id} />)
    expect(screen.getByText('Nom')).toBeInTheDocument()
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument()
    expect(screen.getByText('Alan Turing')).toBeInTheDocument()
  })

  it('affiche l\'état vide quand il n\'y a aucune ligne', () => {
    render(
      <DataTable
        columns={COLUMNS}
        rows={[]}
        getRowId={p => p.id}
        emptyState={<p>Aucune donnée</p>}
      />
    )
    expect(screen.getByText('Aucune donnée')).toBeInTheDocument()
    expect(screen.queryByText('Nom')).not.toBeInTheDocument()
  })

  it('rend la barre d\'outils au-dessus de la table', () => {
    render(
      <DataTable columns={COLUMNS} rows={PEOPLE} getRowId={p => p.id} toolbar={<div>Filtres</div>} />
    )
    expect(screen.getByText('Filtres')).toBeInTheDocument()
  })

  it('déplie une ligne via le contexte fourni à la cellule', () => {
    const columns: DataTableColumn<Person>[] = [
      {
        id: 'name',
        header: 'Nom',
        cell: (row, ctx) => (
          <button type="button" onClick={ctx.toggleExpanded} aria-expanded={ctx.expanded}>
            {row.name}
          </button>
        ),
      },
    ]
    render(
      <DataTable
        columns={columns}
        rows={PEOPLE}
        getRowId={p => p.id}
        renderDetail={row => <span>Détail de {row.name}</span>}
      />
    )
    expect(screen.queryByText('Détail de Ada Lovelace')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Ada Lovelace' }))
    expect(screen.getByText('Détail de Ada Lovelace')).toBeInTheDocument()
  })

  it('applique la classe de ligne renvoyée par rowClassName', () => {
    const { container } = render(
      <DataTable
        columns={COLUMNS}
        rows={PEOPLE}
        getRowId={p => p.id}
        rowClassName={p => (p.id === '1' ? 'is-flagged' : undefined)}
      />
    )
    expect(container.querySelector('.data-table__row.is-flagged')).not.toBeNull()
  })

  it('ne rend pas de panneau de détail sans renderDetail', () => {
    const columns: DataTableColumn<Person>[] = [
      {
        id: 'name',
        header: 'Nom',
        cell: (row, ctx) => (
          <button type="button" onClick={ctx.toggleExpanded}>{row.name}</button>
        ),
      },
    ]
    const { container } = render(
      <DataTable columns={columns} rows={PEOPLE} getRowId={p => p.id} />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Ada Lovelace' }))
    expect(container.querySelector('.data-table__detail-row')).toBeNull()
  })

  it('utilise les classes d\'en-tête et de cellule fournies', () => {
    const columns: DataTableColumn<Person>[] = [
      { id: 'name', header: 'Nom', headerClassName: 'col-name', cellClassName: 'cell-name', cell: row => row.name },
    ]
    const { container } = render(
      <DataTable columns={columns} rows={PEOPLE} getRowId={p => p.id} />
    )
    expect(container.querySelector('.data-table__th.col-name')).not.toBeNull()
    expect(container.querySelector('.data-table__cell.cell-name')).not.toBeNull()
  })

  it('expose un libellé accessible sur la table', () => {
    render(<DataTable columns={COLUMNS} rows={PEOPLE} getRowId={p => p.id} ariaLabel="Personnes" />)
    expect(screen.getByRole('table', { name: 'Personnes' })).toBeInTheDocument()
  })

  it('garde l\'état de dépliage propre à chaque ligne', () => {
    const columns: DataTableColumn<Person>[] = [
      {
        id: 'name',
        header: 'Nom',
        cell: (row, ctx) => (
          <button type="button" onClick={ctx.toggleExpanded}>{row.name}</button>
        ),
      },
    ]
    render(
      <DataTable
        columns={columns}
        rows={PEOPLE}
        getRowId={p => p.id}
        renderDetail={row => <span>Détail {row.name}</span>}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Ada Lovelace' }))
    expect(screen.getByText('Détail Ada Lovelace')).toBeInTheDocument()
    // La seconde ligne reste repliée.
    expect(screen.queryByText('Détail Alan Turing')).not.toBeInTheDocument()
  })

  it('rend vide sans planter quand emptyState est absent', () => {
    const { container } = render(<DataTable columns={COLUMNS} rows={[]} getRowId={p => p.id} />)
    expect(container.querySelector('.data-table')).toBeNull()
  })
})
