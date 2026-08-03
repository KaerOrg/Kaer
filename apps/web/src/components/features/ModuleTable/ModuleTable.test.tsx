import { vi, describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: 'fr' } }),
}))

import { ModuleTable } from './ModuleTable'
import type { ModuleTableRow } from './ModuleTable.types'

const ROWS: ModuleTableRow[] = [
  {
    id: 'alpha',
    icon: null,
    title: 'Alpha',
    description: 'desc a',
    indications: <span>ind-a</span>,
    unlockedAt: '2026-01-10T00:00:00Z',
    lastActivityAt: '2026-03-01T00:00:00Z',
    activation: <span>tog-a</span>,
  },
  {
    id: 'beta',
    icon: null,
    title: 'Beta',
    description: 'desc b',
    indications: <span>ind-b</span>,
    unlockedAt: '2026-02-10T00:00:00Z',
    lastActivityAt: null,
    activation: <span>tog-b</span>,
  },
]

// Ordre des lignes de données (hors en-tête), lu depuis les titres rendus.
function titleOrder(): string[] {
  return screen
    .getAllByRole('row')
    .map(r => r.textContent ?? '')
    .filter(txt => txt.includes('Alpha') || txt.includes('Beta'))
    .map(txt => (txt.includes('Alpha') ? 'Alpha' : 'Beta'))
}

describe('ModuleTable', () => {
  function renderTable(rows = ROWS, emptyState?: React.ReactNode) {
    return render(
      <ModuleTable
        rows={rows}
        firstColumnLabel="MODULE"
        ariaLabel="modules"
        emptyState={emptyState}
      />,
    )
  }

  it('rend chaque ligne : nom, description, indications, contrôle et dates formatées', () => {
    renderTable()
    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.getByText('desc a')).toBeInTheDocument()
    expect(screen.getByText('ind-a')).toBeInTheDocument()
    expect(screen.getByText('tog-a')).toBeInTheDocument()
    // Date de déblocage d'Alpha formatée en locale fr.
    expect(screen.getByText(new Date('2026-01-10T00:00:00Z').toLocaleDateString('fr'))).toBeInTheDocument()
  })

  it('affiche le placeholder « - » pour une dernière activité absente', () => {
    renderTable()
    expect(screen.getByText('-')).toBeInTheDocument()
  })

  it('rend le badge accolé au nom (titleBadge) quand fourni', () => {
    const rows: ModuleTableRow[] = [{ ...ROWS[0], titleBadge: <span>badge-x</span> }]
    render(<ModuleTable rows={rows} firstColumnLabel="MODULE" ariaLabel="modules" />)
    expect(screen.getByText('badge-x')).toBeInTheDocument()
  })

  it('remplace la date « Débloqué le » par unlockedLabelOverride quand fourni', () => {
    const rows: ModuleTableRow[] = [{ ...ROWS[0], unlockedLabelOverride: 'Toujours dispo.' }]
    render(<ModuleTable rows={rows} firstColumnLabel="MODULE" ariaLabel="modules" />)
    expect(screen.getByText('Toujours dispo.')).toBeInTheDocument()
    // La date brute de déblocage n'est plus formatée/affichée.
    expect(screen.queryByText(new Date('2026-01-10T00:00:00Z').toLocaleDateString('fr'))).not.toBeInTheDocument()
  })

  it('conserve l’ordre métier fourni tant qu’aucun tri n’est actif', () => {
    renderTable()
    expect(titleOrder()).toEqual(['Alpha', 'Beta'])
  })

  it('trie par « Débloqué le » (asc puis desc) au clic sur l’en-tête', () => {
    renderTable()
    const header = screen.getByRole('button', { name: /col_unlocked/ })

    fireEvent.click(header) // asc : 2026-01-10 (Alpha) avant 2026-02-10 (Beta)
    expect(titleOrder()).toEqual(['Alpha', 'Beta'])

    fireEvent.click(header) // desc : ordre inversé
    expect(titleOrder()).toEqual(['Beta', 'Alpha'])
  })

  it('place les lignes sans date en dernier, quel que soit le sens du tri', () => {
    renderTable()
    const header = screen.getByRole('button', { name: /col_last_activity/ })

    fireEvent.click(header) // asc : Beta (null) en dernier
    expect(titleOrder()).toEqual(['Alpha', 'Beta'])

    fireEvent.click(header) // desc : Beta (null) toujours en dernier
    expect(titleOrder()).toEqual(['Alpha', 'Beta'])
  })

  it('affiche l’état vide quand aucune ligne', () => {
    renderTable([], <p>vide</p>)
    expect(screen.getByText('vide')).toBeInTheDocument()
    expect(screen.queryByText('Alpha')).not.toBeInTheDocument()
  })

  describe('clic de ligne + actions au survol (K-3)', () => {
    it('sans onRowClick : aucune colonne d’actions ni ligne cliquable', () => {
      const { container } = renderTable()
      expect(container.querySelector('.module-table__actions')).toBeNull()
      expect(container.querySelector('.data-table__row--clickable')).toBeNull()
    })

    it('avec onRowClick : la ligne appelle onRowClick avec son id', () => {
      const onRowClick = vi.fn()
      render(
        <ModuleTable rows={ROWS} firstColumnLabel="MODULE" ariaLabel="modules" onRowClick={onRowClick} />,
      )
      fireEvent.click(screen.getByText('Alpha'))
      expect(onRowClick).toHaveBeenCalledWith('alpha')
    })

    it('rend la cellule d’actions de chaque ligne quand la table est cliquable', () => {
      const rows: ModuleTableRow[] = [{ ...ROWS[0], actions: <button>ouvrir données</button> }]
      const { container } = render(
        <ModuleTable rows={rows} firstColumnLabel="MODULE" ariaLabel="modules" onRowClick={() => {}} />,
      )
      expect(container.querySelector('.module-table__actions')).not.toBeNull()
      expect(screen.getByRole('button', { name: 'ouvrir données' })).toBeInTheDocument()
    })
  })
})
