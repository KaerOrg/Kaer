import { useTranslation } from 'react-i18next'
import type { ModuleType } from '../../../lib/database.types'
import type { ModuleSummary } from '../../../services/engagementService'
import { readDimensions, readTotalScore } from './summaryReaders'
import './ModuleSummaryPanel.css'

// Modules à dimensions : on affiche les valeurs brutes de chaque sous-échelle.
// Les autres modules (échelles cliniques) n'affichent que le score total.
const TRACKER_MODULES = new Set<string>(['mood_tracker', 'medication_side_effects'])

interface Props {
  summary: ModuleSummary | undefined
  moduleType: ModuleType
  loading: boolean
}

/**
 * Panneau « aperçu » d'une card module : restitue les vraies données patient
 * synchronisées (dernière saisie, nombre d'entrées, valeurs brutes). Aucune
 * logique de fetch (assurée par PatientModulesTab). Conforme MDR : chiffres
 * bruts uniquement, aucun seuil, label interprétatif ni couleur de jugement.
 */
export function ModuleSummaryPanel({ summary, moduleType, loading }: Props) {
  const { t, i18n } = useTranslation()

  if (loading || summary === undefined) {
    return (
      <div className="summary-panel">
        <p className="summary-panel__message">{t('common.loading')}</p>
      </div>
    )
  }

  if (summary.count === 0) {
    return (
      <div className="summary-panel">
        <p className="summary-panel__message">{t('patient.summary_empty')}</p>
      </div>
    )
  }

  const dateLabel = summary.lastDate
    ? new Date(summary.lastDate).toLocaleDateString(i18n.language)
    : '—'
  const isTracker = TRACKER_MODULES.has(moduleType)
  const dimensions = isTracker ? readDimensions(summary.lastPayload) : []
  const totalScore = isTracker ? null : readTotalScore(summary.lastPayload)

  return (
    <div className="summary-panel">
      <dl className="summary-panel__stats">
        <div className="summary-panel__stat">
          <dt className="summary-panel__label">{t('patient.summary_last_entry')}</dt>
          <dd className="summary-panel__value">{dateLabel}</dd>
        </div>
        <div className="summary-panel__stat">
          <dt className="summary-panel__label">{t('patient.summary_count')}</dt>
          <dd className="summary-panel__value">{summary.count}</dd>
        </div>
        {totalScore != null && (
          <div className="summary-panel__stat">
            <dt className="summary-panel__label">{t('patient.summary_total_score')}</dt>
            <dd className="summary-panel__value">{totalScore}</dd>
          </div>
        )}
      </dl>

      {dimensions.length > 0 && (
        <ul className="summary-panel__dimensions">
          {dimensions.map(dim => {
            const label =
              moduleType === 'mood_tracker'
                ? t(`evolution.mood_${dim.key}`, { defaultValue: dim.key })
                : moduleType === 'medication_side_effects'
                  ? t(`evolution.med_effect_${dim.key}`, { defaultValue: dim.key })
                  : dim.key
            return (
              <li key={dim.key} className="summary-panel__dimension">
                <span className="summary-panel__dim-label">{label}</span>
                <span className="summary-panel__dim-value">{dim.value}</span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
