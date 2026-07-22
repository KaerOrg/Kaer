import { useTranslation } from 'react-i18next'
import type { DefusionMonthGroup } from './defusionData'
import { DEFUSION_AFTER_COLOR, DEFUSION_BEFORE_COLOR } from './clinicalChartConfig'
import { DefusionSessionRow } from './DefusionSessionRow'

interface Props {
  groups: DefusionMonthGroup[]
  locale: string
  revealed: ReadonlySet<string>
  onReveal: (key: string) => void
}

/** Chiffre brut, ou « - » pour une mesure passée (jamais un 0 implicite). */
function cell(value: number | null): string {
  return value === null ? '-' : String(value)
}

/**
 * Tableau chronologique des séances de défusion, groupé par mois (en-tête
 * « Juillet 2026 · N séances »). Colonnes : Date · Technique · Durée · Inconfort
 * (avant · après) · Conviction (avant · après) · Mot. MDR : « avant · après » dans
 * une même cellule au point médian, jamais « → » ; aucune couleur selon la valeur.
 */
export function DefusionSessionsTable({ groups, locale, revealed, onReveal }: Props) {
  const { t } = useTranslation()

  return (
    <table className="defusion-table">
      <thead>
        <tr>
          <th>{t('patient.defusion_col_date')}</th>
          <th>{t('patient.defusion_col_technique')}</th>
          <th className="defusion-table__num">{t('patient.defusion_col_duration')}</th>
          <th className="defusion-table__num">{t('patient.defusion_col_discomfort')}</th>
          <th className="defusion-table__num">{t('patient.defusion_col_belief')}</th>
          <th>{t('patient.defusion_col_word')}</th>
        </tr>
      </thead>

      {groups.map(group => {
        const monthLabel = new Date(`${group.monthKey}-01T00:00:00`).toLocaleDateString(locale, {
          month: 'long', year: 'numeric',
        })
        return (
          <tbody key={group.monthKey}>
            <tr className="defusion-table__group">
              <td colSpan={6}>{monthLabel} · {t('evolution.n_sessions', { count: group.points.length })}</td>
            </tr>
            {group.points.map(p => (
              <DefusionSessionRow
                key={p.date}
                rowKey={p.date}
                dateLabel={new Date(p.date).toLocaleDateString(locale, { day: 'numeric', month: 'short' })}
                techniqueName={t(`modules.cognitive_saturation.technique_${p.technique}_name`)}
                dotColor={p.technique === 'word_repetition' ? DEFUSION_AFTER_COLOR : DEFUSION_BEFORE_COLOR}
                durationLabel={p.duration_seconds > 0 ? `${p.duration_seconds} s` : '-'}
                discomfortCell={`${cell(p.discomfort_before)} · ${cell(p.discomfort_after)}`}
                beliefCell={`${cell(p.belief_before)} · ${cell(p.belief_after)}`}
                word={p.word}
                revealed={revealed.has(p.date)}
                revealLabel={t('patient.defusion_reveal_word')}
                onReveal={onReveal}
              />
            ))}
          </tbody>
        )
      })}
    </table>
  )
}
