import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Button } from '../../../components/ui/Button'
import type { ModuleType } from '../../../lib/database.types'
import type { FormEntryRow } from '@services/engagementService'
import { moduleQueries } from '../../../hooks/queries'
import { colorAt } from '../../../lib/chartConfig'
import {
  buildColumnSpecs,
  buildSliderSpecs,
  buildChartData,
  chartYDomain,
} from './columnFormData'
import { ModuleChart } from './ModuleChart'
import { ColumnFormRecordCard } from './ColumnFormRecordCard'
import './ColumnFormDataPanel.css'

// Fiches affichées par page (bouton « voir plus ») — borne le DOM à 10× la charge.
const RECORDS_PAGE_SIZE = 10

interface Props {
  moduleType: ModuleType
  entries: FormEntryRow[]
}

/**
 * Panneau « Données » des modules `column_form` (beck_columns…) : courbes brutes
 * de tous les curseurs du module + fiches complètes en ordre antichronologique.
 * Structure, libellés et couleurs dérivés de `module_content_fields` — aucun
 * hardcode d'un module (config-first). Conforme MDR 2017/745 : valeurs brutes,
 * aucun seuil, label interprétatif ni couleur de jugement.
 */
export function ColumnFormDataPanel({ moduleType, entries }: Props) {
  const { t, i18n } = useTranslation()
  const fieldsQuery = useQuery(moduleQueries.fields(moduleType))
  const fields = useMemo(() => fieldsQuery.data?.fields ?? [], [fieldsQuery.data])

  const columns = useMemo(() => buildColumnSpecs(fields), [fields])
  const sliders = useMemo(() => buildSliderSpecs(columns), [columns])
  const chartData = useMemo(() => buildChartData(entries, sliders), [entries, sliders])
  const series = useMemo(
    () => sliders.map((s, i) => ({
      key: s.key,
      color: colorAt(i),
      label: s.labelCode ? t(s.labelCode) : s.key,
    })),
    [sliders, t],
  )
  const yDomain = useMemo(() => chartYDomain(sliders), [sliders])

  // Fiches : la plus récente d'abord (le service renvoie l'ordre chronologique).
  const records = useMemo(() => entries.slice().reverse(), [entries])
  const [visibleCount, setVisibleCount] = useState(RECORDS_PAGE_SIZE)
  const showMore = useCallback(() => setVisibleCount(c => c + RECORDS_PAGE_SIZE), [])
  const visible = records.slice(0, visibleCount)

  if (fieldsQuery.isLoading) {
    return (
      <div className="module-data-panel">
        <p className="module-data-panel__message">{t('common.loading')}</p>
      </div>
    )
  }

  return (
    <div className="module-data-panel">
      {sliders.length > 0 && (
        <ModuleChart
          title={t(`modules.${moduleType}.label`)}
          count={entries.length}
          data={chartData}
          series={series}
          yDomain={yDomain}
          showLegend
          locale={i18n.language}
        />
      )}

      <div className="cfd-records">
        <h4 className="cfd-records__title">{t('patient.form_records_title')}</h4>
        {visible.map((entry, i) => (
          <ColumnFormRecordCard
            key={`${entry.date}-${i}`}
            entry={entry}
            columns={columns}
            locale={i18n.language}
            t={t}
          />
        ))}
        {records.length > visibleCount && (
          <Button variant="ghost" size="xs" onClick={showMore}>
            {t('patient.form_show_more', { count: records.length - visibleCount })}
          </Button>
        )}
      </div>
    </div>
  )
}
