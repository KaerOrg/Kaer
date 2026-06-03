import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { SearchInput } from '../../ui/SearchInput'
import { SelectField } from '../../ui/SelectField/SelectField'
import { Chip } from '../../ui/Chip'
import type { CaseloadFilterState } from './types'

export interface CaseloadFiltersProps {
  value: CaseloadFilterState
  onChange: (next: CaseloadFilterState) => void
}

export function CaseloadFilters({ value, onChange }: CaseloadFiltersProps) {
  const { t } = useTranslation()

  const toggleImportant = useCallback(
    () => onChange({ ...value, onlyImportant: !value.onlyImportant }),
    [value, onChange]
  )
  const toggleOverdue = useCallback(
    () => onChange({ ...value, onlyOverdue: !value.onlyOverdue }),
    [value, onChange]
  )
  const toggleWaiting = useCallback(
    () => onChange({ ...value, onlyWaiting: !value.onlyWaiting }),
    [value, onChange]
  )

  return (
    <div className="caseload-filters">
      <div className="caseload-filters__search">
        <SearchInput
          value={value.search}
          onChange={search => onChange({ ...value, search })}
          placeholder={t('file_active.filters.search_placeholder')}
        />
      </div>

      <SelectField
        label={t('file_active.filters.status_label')}
        id="caseload-status-filter"
        value={value.status}
        onChange={e => onChange({ ...value, status: e.target.value as CaseloadFilterState['status'] })}
      >
        <option value="all">{t('file_active.filters.status_all')}</option>
        <option value="active">{t('file_active.status.active')}</option>
        <option value="paused">{t('file_active.status.paused')}</option>
      </SelectField>

      <div className="caseload-filters__chips" role="group" aria-label={t('file_active.filters.chips_label')}>
        <Chip
          selectable
          selected={value.onlyImportant}
          onClick={toggleImportant}
          label={t('file_active.filters.chip_important')}
        />
        <Chip
          selectable
          selected={value.onlyOverdue}
          onClick={toggleOverdue}
          label={t('file_active.filters.chip_overdue')}
        />
        <Chip
          selectable
          selected={value.onlyWaiting}
          onClick={toggleWaiting}
          label={t('file_active.filters.chip_waiting')}
        />
      </div>
    </div>
  )
}
