import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { CHRONO_ANCHOR_KEYS, buildRhythmogramAnchors } from '../../../lib/chronoAnchors'
import { buildRhythmogram, type RhythmEntry } from '@kaer/shared'
import { ChronoRhythmogram } from '../../../components/features/ChronoRhythmogram'

interface Props {
  entries: RhythmEntry[]
}

interface YearMonth {
  year: number
  month: number // 1-12
}

// Mois distincts présents dans les saisies, du plus ancien au plus récent.
function monthsWithData(entries: RhythmEntry[]): YearMonth[] {
  const seen = new Set<string>()
  const out: YearMonth[] = []
  for (const e of entries) {
    const ym = e.date.slice(0, 7) // YYYY-MM
    if (seen.has(ym)) continue
    seen.add(ym)
    out.push({ year: Number(ym.slice(0, 4)), month: Number(ym.slice(5, 7)) })
  }
  out.sort((a, b) => a.year - b.year || a.month - b.month)
  return out
}

/**
 * Panneau « Données » du module « Rythmes & régularité » : rythmogramme d'UN mois
 * (heure de chaque repère jour par jour) + navigation entre les mois saisis.
 * L'écart-type brut de chaque repère apparaît dans la légende.
 * Conforme MDR 2017/745 : horaires bruts uniquement, aucun seuil ni interprétation.
 */
export function ChronoRhythmogramPanel({ entries }: Props) {
  const { t, i18n } = useTranslation()
  const months = useMemo(() => monthsWithData(entries), [entries])
  // Par défaut : le mois le plus récent renseigné.
  const [idx, setIdx] = useState(months.length - 1)

  // Tous les hooks s'exécutent inconditionnellement (Rules of Hooks) : le mois
  // courant est nullable tant qu'aucune saisie n'existe, l'écran vide est géré
  // par un return APRÈS les hooks.
  const safeIdx = months.length === 0 ? 0 : Math.min(Math.max(idx, 0), months.length - 1)
  const current = months[safeIdx] ?? null

  const result = useMemo(
    () => (current ? buildRhythmogram(entries, CHRONO_ANCHOR_KEYS, current.year, current.month) : null),
    [entries, current],
  )
  const chartAnchors = useMemo(
    () => (result ? buildRhythmogramAnchors(result.anchors, t) : []),
    [result, t],
  )

  const monthLabel = useMemo(() => {
    if (!current) return ''
    const raw = new Date(current.year, current.month - 1, 1).toLocaleDateString(i18n.language, {
      month: 'long',
      year: 'numeric',
    })
    return raw.charAt(0).toUpperCase() + raw.slice(1)
  }, [current, i18n.language])

  const goPrev = useCallback(() => setIdx(safeIdx - 1), [safeIdx])
  const goNext = useCallback(() => setIdx(safeIdx + 1), [safeIdx])

  if (!current || !result) {
    return (
      <div className="module-data-panel">
        <p className="module-data-panel__message">{t('patient.summary_empty')}</p>
      </div>
    )
  }

  return (
    <div className="module-data-panel">
      <div className="rhythmogram__header">
        <p className="chrono-regularity__title">{t('modules.chronobiology_tracker.regularity_title')}</p>
        <div className="rhythmogram__nav">
          <Button
            variant="ghost"
            size="xs"
            icon={<ChevronLeft size={18} />}
            aria-label={t('common.previous')}
            disabled={safeIdx === 0}
            onClick={goPrev}
          />
          <span className="rhythmogram__month">{monthLabel}</span>
          <Button
            variant="ghost"
            size="xs"
            icon={<ChevronRight size={18} />}
            aria-label={t('common.next')}
            disabled={safeIdx === months.length - 1}
            onClick={goNext}
          />
        </div>
      </div>
      <p className="chrono-regularity__note">{t('modules.chronobiology_tracker.regularity_note')}</p>

      <ChronoRhythmogram
        data={result.data}
        anchors={chartAnchors}
        yDomain={result.yDomain}
        weekStarts={result.weekStarts}
        year={current.year}
        month={current.month}
        locale={i18n.language}
        xAxisLabel={t('modules.chronobiology_tracker.axis_day')}
        yAxisLabel={t('modules.chronobiology_tracker.axis_time')}
      />
    </div>
  )
}
