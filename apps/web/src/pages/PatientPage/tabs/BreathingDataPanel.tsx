import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Chip } from '../../../components/ui/Chip'
import { SegmentedControl, type SegmentOption } from '../../../components/ui/SegmentedControl'
import {
  readBreathingTechniques, filterSessions, summarize, countFeelings, countMoments,
  buildCsv, periodStart, todayIso, BREATHING_PERIODS,
  type BreathingPeriod, type BreathingSessionRow,
} from '@kaer/shared'
import { moduleQueries } from '../../../hooks/queries'
import { BreathingTechniqueChip } from './BreathingTechniqueChip'
import { BreathingFeelingBars } from './BreathingFeelingBars'
import { BreathingMomentBars } from './BreathingMomentBars'
import { BreathingJournal } from './BreathingJournal'
import { csvFileName, downloadCsv } from './breathingDataConfig'
import './BreathingDataPanel.css'

interface Props {
  sessions: BreathingSessionRow[]
  /** Référence publique du patient, pour nommer le fichier exporté. */
  patientRef: string
  /**
   * Rappel réglé par le patient, déjà formaté (« Rappel patient réglé sur 21:00 ·
   * jours choisis : L, Me, V »). `null` = aucun rappel actif.
   */
  reminderSummary: string | null
  locale: string
}

/** Nombre de jours couverts par une période, pour le rythme hebdomadaire. */
const PERIOD_OBSERVED_DAYS: Record<BreathingPeriod, number | null> = {
  '30d': 30, '3m': 90, '6m': 180, all: null,
}

/**
 * Onglet « Données » du module respiration (W1). Vue praticien complète : synthèse,
 * ressentis par technique, moment de pratique, journal paginé, export CSV.
 *
 * **MDR 2017/745, à lire avant toute évolution de cet écran.** Tout ce qui s'affiche
 * ici est un compte brut ou une durée. Sont interdits : moyenne pondérée du ressenti,
 * courbe de tendance, corrélation technique × ressenti, et tout texte qui désignerait
 * une technique comme efficace. La couleur code l'identité d'une technique ou d'un
 * ressenti nommé, jamais une valence.
 */
export function BreathingDataPanel({ sessions, patientRef, reminderSummary, locale }: Props) {
  const { t } = useTranslation()
  const [period, setPeriod] = useState<BreathingPeriod>('30d')
  const [technique, setTechnique] = useState<string | null>(null)

  const { data: moduleFields } = useQuery(moduleQueries.fields('breathing_techniques'))
  const techniques = useMemo(
    () => readBreathingTechniques(moduleFields?.fields ?? []),
    [moduleFields],
  )

  // Le jour de référence est figé au montage : le recalculer à chaque rendu ferait
  // glisser la fenêtre sous les yeux du praticien.
  const today = useMemo(() => todayIso(), [])

  const filtered = useMemo(
    () => filterSessions(sessions, period, today, technique),
    [sessions, period, today, technique],
  )
  const summary = useMemo(
    () => summarize(filtered, PERIOD_OBSERVED_DAYS[period]),
    [filtered, period],
  )
  const feelings = useMemo(
    () => countFeelings(filtered, techniques.map(tech => tech.key)),
    [filtered, techniques],
  )
  const moments = useMemo(() => countMoments(filtered), [filtered])

  const techniqueLabels = useMemo(
    () => new Map(techniques.map(tech => [
      tech.key,
      { name: t(`modules.breathing_techniques.${tech.key}_name`), color: tech.color },
    ])),
    [techniques, t],
  )

  const periodOptions = useMemo<readonly SegmentOption<BreathingPeriod>[]>(
    () => BREATHING_PERIODS.map(p => ({ value: p, label: t(`patient.breathing_period_${p}`) })),
    [t],
  )

  const handleAllTechniques = useCallback(() => setTechnique(null), [])
  const handleExport = useCallback(() => {
    downloadCsv(csvFileName(patientRef, today), buildCsv(filtered))
  }, [patientRef, today, filtered])

  const averageMinutes = Math.round(summary.averageDurationSeconds / 60)
  const rangeStart = periodStart(period, today)

  return (
    <div className="breathing-data-panel">
      {/* Barre de contrôle : période, technique, export. */}
      <div className="breathing-data-panel__toolbar">
        <SegmentedControl
          options={periodOptions}
          value={period}
          onChange={setPeriod}
          ariaLabel={t('patient.breathing_period_label')}
        />
        <div className="breathing-data-panel__filters">
          <Chip
            label={t('patient.breathing_technique_all')}
            selectable
            selected={technique === null}
            onClick={handleAllTechniques}
          />
          {techniques.map(tech => (
            <BreathingTechniqueChip
              key={tech.key}
              techniqueKey={tech.key}
              label={techniqueLabels.get(tech.key)?.name ?? tech.key}
              selected={technique === tech.key}
              onSelect={setTechnique}
            />
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={handleExport} data-testid="breathing-export">
          {t('patient.breathing_export_csv')}
        </Button>
      </div>

      {/* Quatre tuiles de synthèse, sur la période et le filtre actifs. */}
      <div className="breathing-data-panel__tiles">
        <Card variant="outlined">
          <span className="breathing-tile__label">{t('patient.breathing_tile_sessions')}</span>
          <span className="breathing-tile__value" data-testid="breathing-tile-sessions">{summary.sessions}</span>
        </Card>
        <Card variant="outlined">
          <span className="breathing-tile__label">{t('patient.breathing_tile_average')}</span>
          <span className="breathing-tile__value">{t('patient.breathing_minutes', { count: averageMinutes })}</span>
        </Card>
        <Card variant="outlined">
          <span className="breathing-tile__label">{t('patient.breathing_tile_completed')}</span>
          <span className="breathing-tile__value" data-testid="breathing-tile-completed">
            {summary.completed} / {summary.sessions}
          </span>
        </Card>
        <Card variant="outlined">
          <span className="breathing-tile__label">{t('patient.breathing_tile_days')}</span>
          <span className="breathing-tile__value">{summary.practiceDaysPerWeek}</span>
        </Card>
      </div>

      <Card variant="outlined" header={{ title: t('patient.breathing_feeling_title') }}>
        {feelings.map(counts => (
          <BreathingFeelingBars
            key={counts.techniqueKey}
            counts={counts}
            techniqueName={techniqueLabels.get(counts.techniqueKey)?.name ?? counts.techniqueKey}
          />
        ))}
        <p className="breathing-data-panel__note">{t('patient.breathing_feeling_note')}</p>
      </Card>

      <Card variant="outlined" header={{ title: t('patient.breathing_moment_title') }}>
        <BreathingMomentBars counts={moments} reminderSummary={reminderSummary} />
      </Card>

      <Card variant="outlined" header={{ title: t('patient.breathing_journal_title') }}>
        <BreathingJournal sessions={filtered} techniqueLabels={techniqueLabels} locale={locale} />
      </Card>

      <p className="breathing-data-panel__footer">
        {t('patient.breathing_data_footer')}
        {rangeStart != null && (
          <span className="breathing-data-panel__range"> · {t('patient.breathing_since', { date: rangeStart })}</span>
        )}
      </p>
    </div>
  )
}
