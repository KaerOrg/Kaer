import { describe, it, expect } from 'vitest'
import type { ReactNode } from 'react'
import { render } from '@testing-library/react'
import { DataTableCell } from './DataTableCell'
import type { DataTableColumn, DataTableRowContext } from './DataTable.types'

interface Patient {
  readonly name: string
}

const ctx: DataTableRowContext = { expanded: false, toggleExpanded: () => {} }

function column(over: Partial<DataTableColumn<Patient>> = {}): DataTableColumn<Patient> {
  return { id: 'name', header: 'Nom', cell: row => row.name, ...over }
}

function renderInRow(ui: ReactNode) {
  return render(
    <table>
      <tbody>
        <tr>{ui}</tr>
      </tbody>
    </table>
  )
}

describe('DataTableCell', () => {
  it('rend un <td> avec la classe de base et la valeur calculée par la colonne', () => {
    const { container, getByText } = renderInRow(
      <DataTableCell column={column()} row={{ name: 'Bonjour' }} ctx={ctx} />
    )
    const cell = container.querySelector('td')
    expect(cell).not.toBeNull()
    expect(cell).toHaveClass('data-table__cell')
    expect(getByText('Bonjour')).toBeInTheDocument()
  })

  it('ajoute la classe métier optionnelle de la colonne', () => {
    const { container } = renderInRow(
      <DataTableCell column={column({ cellClassName: 'cell-name' })} row={{ name: 'X' }} ctx={ctx} />
    )
    const cell = container.querySelector('td')
    expect(cell).toHaveClass('data-table__cell')
    expect(cell).toHaveClass('cell-name')
  })

  it('reste valide sans classe métier', () => {
    const { container } = renderInRow(
      <DataTableCell column={column()} row={{ name: 'X' }} ctx={ctx} />
    )
    expect(container.querySelector('td')?.className.trim()).toBe('data-table__cell')
  })

  it('passe la ligne et le contexte au rendu de la colonne', () => {
    const col = column({
      cell: (row, c) => `${row.name}-${c.expanded ? 'open' : 'closed'}`,
    })
    const { getByText } = renderInRow(
      <DataTableCell column={col} row={{ name: 'Léa' }} ctx={{ ...ctx, expanded: true }} />
    )
    expect(getByText('Léa-open')).toBeInTheDocument()
  })
})
