import { useTranslation } from 'react-i18next'
import { SearchInput } from '../../ui/SearchInput'
import { SelectField } from '../../ui/SelectField/SelectField'
import type { CaseloadFilterState } from './types'

export interface CaseloadFiltersProps {
  value: CaseloadFilterState
  onChange: (next: CaseloadFilterState) => void
}

export function CaseloadFilters({ value, onChange }: CaseloadFiltersProps) {
  const { t } = useTranslation()

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
        <button
          type="button"
          className={`caseload-chip ${value.onlyImportant ? 'caseload-chip--active' : ''}`}
          aria-pressed={value.onlyImportant}
          onClick={() => onChange({ ...value, onlyImportant: !value.onlyImportant })}
        >
          {t('file_active.filters.chip_important')}
        </button>
        <button
          type="button"
          className={`caseload-chip ${value.onlyOverdue ? 'caseload-chip--active' : ''}`}
          aria-pressed={value.onlyOverdue}
          onClick={() => onChange({ ...value, onlyOverdue: !value.onlyOverdue })}
        >
          {t('file_active.filters.chip_overdue')}
        </button>
        <button
          type="button"
          className={`caseload-chip ${value.onlyWaiting ? 'caseload-chip--active' : ''}`}
          aria-pressed={value.onlyWaiting}
          onClick={() => onChange({ ...value, onlyWaiting: !value.onlyWaiting })}
        >
          {t('file_active.filters.chip_waiting')}
        </button>
      </div>
    </div>
  )
}
