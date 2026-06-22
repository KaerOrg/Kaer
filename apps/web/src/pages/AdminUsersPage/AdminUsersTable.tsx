import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Eye, Stethoscope, User, Users } from 'lucide-react'
import {
  DataTable,
  type DataTableColumn,
  type DataTableSort,
  type DataTablePaginationState,
} from '../../components/ui/DataTable'
import { Drawer } from '../../components/ui/Drawer'
import { SearchInput } from '../../components/ui/SearchInput'
import { SegmentedControl, type SegmentOption } from '../../components/ui/SegmentedControl'
import { SelectField } from '../../components/ui/SelectField/SelectField'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { EmptyState } from '../../components/ui/EmptyState'
import { useToast } from '../../contexts/ToastContext'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { adminQueries } from '../../hooks/queries'
import { AdminUserDetail } from './AdminUserDetail'
import type { AdminUser, AdminUsersQuery, AdminUserSortColumn } from '../../services/adminService'
import './AdminUsersPage.css'

type KindFilter = 'all' | 'patient' | 'practitioner'

const PAGE_SIZE = 150
const ALL_PRACTITIONERS = ''
const SEARCH_DEBOUNCE_MS = 300
const DEFAULT_SORT: DataTableSort = { column: 'created_at', direction: 'desc' }

const getRowId = (u: AdminUser) => u.user_id

/**
 * Table admin de tous les utilisateurs (patients + médecins). Conteneur : possède
 * l'état des filtres / tri / page, qui pilote un fetch **côté serveur** (RPC paginé
 * `admin_list_users`). La table ne trie ni ne pagine jamais en mémoire — elle reflète
 * la page renvoyée. Le filtre « par praticien » n'a de sens que pour les patients :
 * il n'apparaît que quand le type « patient » est sélectionné.
 */
export function AdminUsersTable() {
  const { t, i18n } = useTranslation()
  const toast = useToast()
  const queryClient = useQueryClient()

  const [kind, setKind] = useState<KindFilter>('all')
  const [practitioner, setPractitioner] = useState<string>(ALL_PRACTITIONERS)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<DataTableSort>(DEFAULT_SORT)
  const [page, setPage] = useState(0)
  // Utilisateur dont le détail est ouvert dans le panneau latéral (null = fermé).
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS)

  // Toute saisie de recherche débouncée ramène à la première page.
  useEffect(() => setPage(0), [debouncedSearch])

  const params = useMemo<AdminUsersQuery>(
    () => ({
      kind: kind === 'all' ? null : kind,
      // Le filtre praticien ne s'applique qu'aux patients (cf. UI conditionnelle).
      practitioner: kind === 'patient' && practitioner !== ALL_PRACTITIONERS ? practitioner : null,
      search: debouncedSearch.trim() === '' ? null : debouncedSearch.trim(),
      sort: sort.column as AdminUserSortColumn,
      dir: sort.direction,
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
    }),
    [kind, practitioner, debouncedSearch, sort, page]
  )

  const usersQuery = useQuery(adminQueries.users(params))
  const namesQuery = useQuery(adminQueries.practitionerNames())

  useEffect(() => {
    if (usersQuery.isError) toast.error(t('admin_users.error_load'))
  }, [usersQuery.isError, toast, t])

  // Effacement d'un patient → recharger la page courante (la suppression décale la
  // pagination ; invalider et refetch est plus juste qu'une retouche de cache locale).
  const handleErased = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
  }, [queryClient])

  const toggleSelected = useCallback(
    (id: string) => setSelectedId(prev => (prev === id ? null : id)),
    []
  )
  const closePanel = useCallback(() => setSelectedId(null), [])

  const handleKindChange = useCallback((next: KindFilter) => {
    setKind(next)
    if (next !== 'patient') setPractitioner(ALL_PRACTITIONERS)
    setPage(0)
  }, [])

  const handlePractitionerChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setPractitioner(e.target.value)
    setPage(0)
  }, [])

  const handleSortChange = useCallback((column: string) => {
    setSort(prev =>
      prev.column === column
        ? { column, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { column, direction: 'asc' }
    )
    setPage(0)
  }, [])

  const kindOptions = useMemo<SegmentOption<KindFilter>[]>(
    () => [
      { value: 'all', label: t('admin_users.filter.all') },
      { value: 'patient', label: t('admin_users.filter.patients') },
      { value: 'practitioner', label: t('admin_users.filter.practitioners') },
    ],
    [t]
  )

  const columns = useMemo<DataTableColumn<AdminUser>[]>(
    () => [
      {
        id: 'display_name',
        header: t('admin_users.col.name'),
        sortable: true,
        cellClassName: 'admin-users__cell-name',
        cell: row => {
          const open = selectedId === row.user_id
          return (
            <button
              type="button"
              className="admin-users__name-toggle"
              onClick={() => toggleSelected(row.user_id)}
              aria-expanded={open}
            >
              <Eye size={15} />
              <span>{row.display_name}</span>
            </button>
          )
        },
      },
      {
        id: 'kind',
        header: t('admin_users.col.type'),
        sortable: true,
        headerClassName: 'admin-users__col-type',
        cellClassName: 'admin-users__col-type admin-users__cell-type',
        cell: row =>
          row.kind === 'patient' ? (
            <StatusBadge variant="info" label={t('admin_users.type_patient')} />
          ) : (
            <StatusBadge
              variant="success"
              label={t('admin_users.type_practitioner')}
              value={row.is_admin ? t('admin_users.role_admin') : undefined}
            />
          ),
      },
      {
        id: 'email',
        header: t('admin_users.col.email'),
        sortable: true,
        cell: row => row.email,
      },
      {
        id: 'practitioners',
        header: t('admin_users.col.practitioners'),
        sortable: true,
        cell: row =>
          row.kind === 'patient' && row.practitioner_names.length > 0
            ? row.practitioner_names.join(', ')
            : t('admin_users.col.no_practitioner'),
      },
      {
        id: 'created_at',
        header: t('admin_users.col.created'),
        sortable: true,
        cell: row => new Date(row.created_at).toLocaleDateString(i18n.language),
      },
    ],
    [t, i18n.language, selectedId, toggleSelected]
  )

  const showPractitionerFilter = kind === 'patient'

  const toolbar = (
    <div className="admin-users__filters">
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder={t('admin_users.search_placeholder')}
        ariaLabel={t('admin_users.search_placeholder')}
      />
      <SegmentedControl
        options={kindOptions}
        value={kind}
        onChange={handleKindChange}
        ariaLabel={t('admin_users.filter.aria')}
      />
      {showPractitionerFilter ? (
        <SelectField
          label={t('admin_users.filter.by_practitioner')}
          aria-label={t('admin_users.filter.by_practitioner')}
          value={practitioner}
          onChange={handlePractitionerChange}
        >
          <option value={ALL_PRACTITIONERS}>{t('admin_users.filter.all_practitioners')}</option>
          {(namesQuery.data ?? []).map(name => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </SelectField>
      ) : null}
    </div>
  )

  const users = usersQuery.data?.users ?? []
  const total = usersQuery.data?.total ?? 0

  // Le détail suit la donnée vivante : on relit la ligne depuis la page courante.
  // Si la ligne disparaît (effacement, changement de filtre), le panneau se ferme.
  const selectedUser = useMemo(
    () => (selectedId ? users.find(u => u.user_id === selectedId) ?? null : null),
    [users, selectedId]
  )

  const hasActiveFilter =
    kind !== 'all' || practitioner !== ALL_PRACTITIONERS || debouncedSearch.trim() !== ''

  const emptyState = usersQuery.isPending ? (
    <div className="admin-users__loading">{t('common.loading')}</div>
  ) : (
    <EmptyState
      icon={<Users size={48} />}
      title={hasActiveFilter ? t('admin_users.empty.no_match_title') : t('admin_users.empty.title')}
      description={
        hasActiveFilter
          ? t('admin_users.empty.no_match_description')
          : t('admin_users.empty.description')
      }
    />
  )

  const pagination = useMemo<DataTablePaginationState>(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      total,
      onPageChange: setPage,
      labels: {
        previous: t('admin_users.pagination.previous'),
        next: t('admin_users.pagination.next'),
        range: (from, to, totalCount) =>
          t('admin_users.pagination.range', { from, to, total: totalCount }),
      },
    }),
    [page, total, t]
  )

  return (
    <>
      <DataTable
        columns={columns}
        rows={users}
        getRowId={getRowId}
        toolbar={toolbar}
        emptyState={emptyState}
        ariaLabel={t('admin_users.title')}
        className="admin-users__table"
        sort={sort}
        onSortChange={handleSortChange}
        pagination={pagination}
      />

      {selectedUser ? (
        <Drawer
          title={selectedUser.display_name}
          subtitle={selectedUser.email}
          icon={selectedUser.kind === 'patient' ? <User size={18} /> : <Stethoscope size={18} />}
          onClose={closePanel}
          storageKey="admin-users-drawer-width"
          topOffset={60}
        >
          <AdminUserDetail user={selectedUser} onErased={handleErased} />
        </Drawer>
      ) : null}
    </>
  )
}
