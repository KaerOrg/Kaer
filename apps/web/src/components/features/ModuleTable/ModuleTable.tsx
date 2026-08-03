import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { DataTable } from '@ui/DataTable'
import type { DataTableColumn, DataTableSort } from '@ui/DataTable'
import type { ModuleTableRow } from './ModuleTable.types'
import './ModuleTable.css'

interface ModuleTableProps {
  readonly rows: readonly ModuleTableRow[]
  /**
   * Libellé de la 1ʳᵉ colonne : « Module » pour l'onglet Modules, « Échelle &
   * questionnaire » pour l'onglet Échelles (K-4). Les 4 autres colonnes sont communes.
   */
  readonly firstColumnLabel: string
  /** Libellé accessible de la table. */
  readonly ariaLabel: string
  /** Affiché à la place de la table quand `rows` est vide (ex. filtre sans résultat). */
  readonly emptyState?: ReactNode
}

// Placeholder « valeur absente » : trait d'union simple (jamais un tiret long).
const EMPTY_DATE = '-'

/**
 * Tableau dense des modules / échelles activés d'un patient (K-1). Assemble le
 * primitive `ui/DataTable` avec les 5 colonnes de l'armoire : Module (icône + nom +
 * description tronquée), Indications, Débloqué le, Dernière activité, Activé. Possède
 * l'état de tri (les deux colonnes de date) et réordonne lui-même les lignes — le
 * primitive `DataTable` ne trie jamais. Réutilisable par l'onglet Échelles (K-4) via
 * `firstColumnLabel` et les cellules libres `indications` / `activation`.
 */
export function ModuleTable({ rows, firstColumnLabel, ariaLabel, emptyState }: ModuleTableProps) {
  const { t, i18n } = useTranslation()
  const [sort, setSort] = useState<DataTableSort | undefined>(undefined)

  const formatDate = useCallback(
    (iso: string | null) => (iso ? new Date(iso).toLocaleDateString(i18n.language) : EMPTY_DATE),
    [i18n.language],
  )

  const handleSortChange = useCallback((column: string) => {
    setSort(prev =>
      prev?.column === column
        ? { column, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { column, direction: 'asc' },
    )
  }, [])

  // Tri par une colonne de date. Les lignes sans date (`null`) vont toujours en fin,
  // quel que soit le sens. Sans tri actif, on conserve l'ordre métier fourni.
  const sortedRows = useMemo(() => {
    if (!sort) return rows
    const key = sort.column === 'unlocked' ? 'unlockedAt' : 'lastActivityAt'
    const dir = sort.direction === 'asc' ? 1 : -1
    return [...rows].sort((a, b) => {
      const av = a[key]
      const bv = b[key]
      if (av === bv) return 0
      if (av == null) return 1
      if (bv == null) return -1
      return av < bv ? -dir : dir
    })
  }, [rows, sort])

  const columns = useMemo<DataTableColumn<ModuleTableRow>[]>(
    () => [
      {
        id: 'module',
        header: firstColumnLabel,
        headerClassName: 'module-table__col-module',
        cellClassName: 'module-table__col-module',
        cell: row => (
          <div className="module-table__module">
            {row.icon != null ? <span className="module-table__module-icon">{row.icon}</span> : null}
            <div className="module-table__module-text">
              <span className="module-table__module-title">{row.title}</span>
              <span className="module-table__module-desc">{row.description}</span>
            </div>
          </div>
        ),
      },
      {
        id: 'indications',
        header: t('patient.module_table.col_indications'),
        cell: row => row.indications,
      },
      {
        id: 'unlocked',
        header: t('patient.module_table.col_unlocked'),
        sortable: true,
        cellClassName: 'module-table__col-date',
        cell: row => formatDate(row.unlockedAt),
      },
      {
        id: 'lastActivity',
        header: t('patient.module_table.col_last_activity'),
        sortable: true,
        cellClassName: 'module-table__col-date',
        cell: row => formatDate(row.lastActivityAt),
      },
      {
        id: 'activation',
        header: t('patient.module_table.col_activated'),
        headerClassName: 'module-table__col-activation',
        cellClassName: 'module-table__col-activation',
        cell: row => row.activation,
      },
    ],
    [firstColumnLabel, t, formatDate],
  )

  const getRowId = useCallback((row: ModuleTableRow) => row.id, [])

  return (
    <DataTable
      className="module-table"
      columns={columns}
      rows={sortedRows}
      getRowId={getRowId}
      sort={sort}
      onSortChange={handleSortChange}
      emptyState={emptyState}
      ariaLabel={ariaLabel}
    />
  )
}
