import { useTranslation } from 'react-i18next'
import { LineChart, type SeriesConfig } from '../../../components/ui/Chart'

interface Props {
  title: string
  count: number
  data: Record<string, number | string>[]
  series: SeriesConfig[]
  yDomain: [number, number]
  showLegend?: boolean
  locale: string
}

/**
 * Courbe d'évolution d'un module dans le panneau « Données » d'une card.
 * Présentationnel : reçoit data/series déjà construits par ModuleDataPanel.
 * Affichage passif conforme MDR — valeurs brutes tracées, aucune interprétation.
 */
export function ModuleChart({ title, count, data, series, yDomain, showLegend, locale }: Props) {
  const { t } = useTranslation()
  return (
    <div className="module-data-panel__chart">
      <div className="module-data-panel__chart-header">
        <h4 className="module-data-panel__chart-title">{title}</h4>
        <span className="module-data-panel__chart-count">
          {t('evolution.n_sessions', { count })}
        </span>
      </div>
      {data.length >= 2 ? (
        <LineChart
          data={data}
          series={series}
          yDomain={yDomain}
          showLegend={showLegend}
          locale={locale}
        />
      ) : (
        <p className="module-data-panel__note">{t('evolution.not_enough_data')}</p>
      )}
    </div>
  )
}
