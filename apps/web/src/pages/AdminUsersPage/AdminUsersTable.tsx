import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronRight, Users } from 'lucide-react'
import { DataTable, type DataTableColumn } from '../../components/ui/DataTable'
import { SearchInput } from '../../components/ui/SearchInput'
import { SegmentedControl, type SegmentOption } from '../../components/ui/SegmentedControl'
import { SelectField } from '../../components/ui/SelectField/SelectField'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { EmptyState } from '../../components/ui/EmptyState'
import { AdminUserDetail } from './AdminUserDetail'
import { byPractitionerThenName } from './sortUsers'
import type { AdminUser } from '../../services/adminService'
import './AdminUsersPage.css'

type KindFilter = 'all' | 'patient' | 'practitioner'

interface AdminUsersTableProps {
  readonly users: readonly AdminUser[]
  readonly onErased: (userId: string) => void
}

const getRowId = (u: AdminUser) => u.user_id
const ALL_PRACTITIONERS = ''

/**
 * Table admin de tous les utilisateurs (patients + médecins). Câble le `DataTable`
 * générique avec un badge de type, un panneau de détail (`AdminUserDetail`) et trois
 * filtres composables : type (segmenté), praticien (liste), recherche nom/email.
 */
export function AdminUsersTable({ users, onErased }: AdminUsersTableProps) {
  const { t, i18n } = useTranslation()
  const [query, setQuery] = useState('')
  const [kindFilter, setKindFilter] = useState<KindFilter>('all')
  const [practitioner, setPractitioner] = useState<string>(ALL_PRACTITIONERS)

  // Liste des médecins (pour le filtre « par praticien »), triée.
  const practitionerNames = useMemo(
    () =>
      Array.from(new Set(users.filter(u => u.kind === 'practitioner').map(u => u.display_name))).sort((a, b) =>
        a.localeCompare(b)
      ),
    [users]
  )

  const kindOptions = useMemo<SegmentOption<KindFilter>[]>(
    () => [
      { value: 'all', label: t('admin_users.filter.all') },
      { value: 'patient', label: t('admin_users.filter.patients') },
      { value: 'practitioner', label: t('admin_users.filter.practitioners') },
    ],
    [t]
  )

  const visibleRows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return users
      .filter(u => {
        if (kindFilter !== 'all' && u.kind !== kindFilter) return false
        // Filtre par praticien → uniquement les patients rattachés à ce médecin.
        if (practitioner !== ALL_PRACTITIONERS) {
          if (u.kind !== 'patient' || !u.practitioner_names.includes(practitioner)) return false
        }
        if (q && !`${u.display_name} ${u.email}`.toLowerCase().includes(q)) return false
        return true
      })
      .sort(byPractitionerThenName)
  }, [users, query, kindFilter, practitioner])

  const columns = useMemo<DataTableColumn<AdminUser>[]>(
    () => [
      {
        id: 'name',
        header: t('admin_users.col.name'),
        cellClassName: 'admin-users__cell-name',
        cell: (row, ctx) => (
          <button
            type="button"
            className="admin-users__name-toggle"
            onClick={ctx.toggleExpanded}
            aria-expanded={ctx.expanded}
          >
            {ctx.expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
            <span>{row.display_name}</span>
          </button>
        ),
      },
      {
        id: 'type',
        header: t('admin_users.col.type'),
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
        cell: row => row.email,
      },
      {
        id: 'practitioners',
        header: t('admin_users.col.practitioners'),
        cell: row =>
          row.kind === 'patient' && row.practitioner_names.length > 0
            ? row.practitioner_names.join(', ')
            : t('admin_users.col.no_practitioner'),
      },
      {
        id: 'created',
        header: t('admin_users.col.created'),
        cell: row => new Date(row.created_at).toLocaleDateString(i18n.language),
      },
    ],
    [t, i18n.language]
  )

  const renderDetail = useCallback(
    (row: AdminUser) => <AdminUserDetail user={row} onErased={onErased} />,
    [onErased]
  )

  const toolbar = (
    <div className="admin-users__filters">
      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder={t('admin_users.search_placeholder')}
        ariaLabel={t('admin_users.search_placeholder')}
      />
      <SegmentedControl
        options={kindOptions}
        value={kindFilter}
        onChange={setKindFilter}
        ariaLabel={t('admin_users.filter.aria')}
      />
      <SelectField
        label={t('admin_users.filter.by_practitioner')}
        aria-label={t('admin_users.filter.by_practitioner')}
        value={practitioner}
        onChange={e => setPractitioner(e.target.value)}
      >
        <option value={ALL_PRACTITIONERS}>{t('admin_users.filter.all_practitioners')}</option>
        {practitionerNames.map(name => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </SelectField>
    </div>
  )

  const emptyState =
    users.length === 0 ? (
      <EmptyState
        icon={<Users size={48} />}
        title={t('admin_users.empty.title')}
        description={t('admin_users.empty.description')}
      />
    ) : (
      <EmptyState
        icon={<Users size={48} />}
        title={t('admin_users.empty.no_match_title')}
        description={t('admin_users.empty.no_match_description')}
      />
    )

  return (
    <DataTable
      columns={columns}
      rows={visibleRows}
      getRowId={getRowId}
      toolbar={toolbar}
      renderDetail={renderDetail}
      emptyState={emptyState}
      ariaLabel={t('admin_users.title')}
      className="admin-users__table"
    />
  )
}
