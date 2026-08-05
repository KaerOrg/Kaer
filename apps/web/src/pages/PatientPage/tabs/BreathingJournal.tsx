import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../../../components/ui/Button'
import type { BreathingSessionRow } from '@kaer/shared'
import { FEELING_COLORS } from './breathingDataConfig'

interface Props {
  sessions: readonly BreathingSessionRow[]
  /** Nom traduit et couleur d'identité, par clé de technique. */
  techniqueLabels: ReadonlyMap<string, { name: string; color: string }>
  locale: string
}

/** Sessions par page. Volontairement court : le praticien lit, il ne dépouille pas. */
const PAGE_SIZE = 5

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`
}

/**
 * Journal des sessions, paginé. Une ligne = une session telle qu'elle a été
 * enregistrée : date, technique, durée réellement pratiquée, moment, ressenti.
 *
 * Les sessions **interrompues** apparaissent, marquées comme telles : elles font
 * partie de la pratique, les masquer donnerait une image fausse.
 */
export function BreathingJournal({ sessions, techniqueLabels, locale }: Props) {
  const { t } = useTranslation()
  const [page, setPage] = useState(0)

  const pageCount = Math.max(1, Math.ceil(sessions.length / PAGE_SIZE))
  // La page courante est bornée au rendu : changer de filtre réduit la liste et
  // laisserait sinon le praticien sur une page vide.
  const safePage = Math.min(page, pageCount - 1)
  const visible = useMemo(
    () => sessions.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE),
    [sessions, safePage],
  )

  const previous = useCallback(() => setPage(p => Math.max(0, p - 1)), [])
  const next = useCallback(() => setPage(p => p + 1), [])

  if (sessions.length === 0) {
    return <p className="breathing-journal__empty">{t('patient.breathing_journal_empty')}</p>
  }

  return (
    <div className="breathing-journal">
      <table className="breathing-journal__table">
        <thead>
          <tr>
            <th>{t('patient.breathing_col_date')}</th>
            <th>{t('patient.breathing_col_technique')}</th>
            <th>{t('patient.breathing_col_duration')}</th>
            <th>{t('patient.breathing_col_moment')}</th>
            <th>{t('patient.breathing_col_feeling')}</th>
          </tr>
        </thead>
        <tbody>
          {visible.map(session => {
            const label = techniqueLabels.get(session.techniqueKey)
            return (
              <tr key={session.startedAt} data-testid="breathing-journal-row">
                <td>
                  {new Date(session.startedAt).toLocaleDateString(locale, { day: 'numeric', month: 'short' })}
                </td>
                <td>
                  <span
                    className="breathing-journal__dot"
                    style={{ background: label?.color ?? 'var(--color-border)' }}
                  />
                  {label?.name ?? session.techniqueKey}
                  {!session.completed && (
                    <span className="breathing-journal__badge">
                      {t('patient.breathing_interrupted')}
                    </span>
                  )}
                </td>
                <td>{formatDuration(session.durationSeconds)}</td>
                <td>{session.startedAt.slice(11, 16)}</td>
                <td>
                  {session.feeling == null ? (
                    <span className="breathing-journal__muted">-</span>
                  ) : (
                    <span
                      className="breathing-journal__pill"
                      style={{ background: FEELING_COLORS[session.feeling] }}
                    >
                      {t(`patient.breathing_feeling_${session.feeling}`)}
                    </span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {pageCount > 1 && (
        <div className="breathing-journal__pager">
          <Button variant="ghost" size="xs" onClick={previous} disabled={safePage === 0}>
            {t('common.previous')}
          </Button>
          <span className="breathing-journal__page">
            {t('patient.breathing_page_of', { page: safePage + 1, total: pageCount })}
          </span>
          <Button variant="ghost" size="xs" onClick={next} disabled={safePage >= pageCount - 1}>
            {t('common.next')}
          </Button>
        </div>
      )}
    </div>
  )
}
