import { useMemo } from 'react'
import { readScaleSource } from '@kaer/shared'
import type { ContentField } from '@services/moduleService'
import type { ScalePassation } from '@services/engagementService'
import { Card } from '@ui/Card'
import { SourceCitation } from '../SourceCitation'
import { PassationRowLine } from './PassationRowLine'
import {
  buildPassationRows,
  readMinInterpretableChange,
  readPractitionerNotes,
  NO_VALUE,
} from './passationRows'
import './ScalePassationDetail.css'

export interface ScalePassationDetailProps {
  /** Fields du module : libellés, modalités, notes et mentions de source (config-first). */
  readonly fields: readonly ContentField[]
  readonly passation: ScalePassation
  /** Passation qui précède celle-ci, `null` s'il s'agit de la première. */
  readonly previous: ScalePassation | null
  /** Nom de l'échelle, déjà traduit : le composant ne connaît aucun module. */
  readonly scaleLabel: string
  /** Prochaine échéance (ISO), `null` si l'échelle n'a pas de cadence récurrente. */
  readonly nextDueIso: string | null
  readonly locale: string
  readonly t: (key: string, options?: Record<string, string | number>) => string
}

function formatDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'long' })
}

function formatDateTime(iso: string, locale: string): string {
  return new Date(iso).toLocaleString(locale, {
    day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
  })
}

/**
 * Détail d'une passation d'échelle, côté praticien (#418, QW-1).
 *
 * **Pourquoi cet écran existe.** Les neuf réponses arrivent en clair depuis le mobile
 * depuis toujours, et l'interface n'en montrait que le total. La réponse à la question
 * sur les pensées de mort était donc dans le dossier sans que rien ne la donne à lire.
 *
 * **Ce que l'écran s'interdit** (MDR 2017/745, RÈGLE D'OR) :
 *   - aucun style, aucune classe, aucune couleur ne dépend de la valeur d'une réponse.
 *     L'item 9 n'est pas rouge : le teinter parce que la réponse est non nulle serait
 *     un jugement de gravité rendu par le logiciel ;
 *   - la note du questionnaire s'affiche EN PERMANENCE, y compris quand la réponse est
 *     « Jamais ». Elle appartient à l'instrument, elle n'est pas déclenchée par une
 *     donnée ;
 *   - aucun adjectif de sévérité, aucune tranche de score, aucune recommandation de
 *     conduite. Le clinicien qualifie, le logiciel transcrit.
 *
 * L'écart en points, lui, est montré : c'est une soustraction, adressée à un
 * professionnel, et accompagnée en permanence du plus petit écart interprétable de
 * l'instrument. Cette mention n'est jamais comparée à l'écart affiché.
 *
 * Présentationnel pur : données et libellés injectés par le parent.
 */
export function ScalePassationDetail({
  fields, passation, previous, scaleLabel, nextDueIso, locale, t,
}: ScalePassationDetailProps) {
  const layout = useMemo(
    () => buildPassationRows(fields, passation.answers),
    [fields, passation.answers],
  )
  const notes = useMemo(() => readPractitionerNotes(fields), [fields])
  const minChange = useMemo(() => readMinInterpretableChange(fields), [fields])
  const source = useMemo(() => readScaleSource(fields), [fields])

  // Consigne telle que le patient l'a lue, reconstituée depuis la config : elle dit la
  // fenêtre temporelle sur laquelle les réponses portent, ce qui change leur lecture.
  const instructions = useMemo(
    () => fields
      .filter(f => f.field_type === 'scale_instruction')
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(f => t(f.text_code ?? ''))
      .join(' '),
    [fields, t],
  )

  const delta = useMemo(() => {
    if (previous?.totalScore == null || passation.totalScore == null) return null
    const value = passation.totalScore - previous.totalScore
    return new Intl.NumberFormat(locale, { signDisplay: 'exceptZero' }).format(value)
  }, [previous, passation.totalScore, locale])

  const answerCount = layout.scored.length + layout.unscored.length

  return (
    <div className="spd">
      <header className="spd__header">
        <h4 className="spd__scale">{scaleLabel}</h4>
        <span className="spd__date">
          {t('scales.entry_detail.header_date', { date: formatDateTime(passation.date, locale) })}
        </span>
      </header>

      <div className="spd__layout">
        <aside className="spd__side">
          <Card header={{ title: t('scales.entry_detail.total_label', { scale: scaleLabel }) }}>
            <p className="spd-total">
              <span className="spd-total__score">
                {passation.totalScore != null ? passation.totalScore : NO_VALUE}
              </span>
              {layout.maxScore != null && (
                <span className="spd-total__max">{`/ ${layout.maxScore}`}</span>
              )}
            </p>
            {previous?.totalScore != null && (
              <p className="spd-total__previous">
                {t('scales.entry_detail.previous', {
                  score: previous.totalScore,
                  date: formatDate(previous.date, locale),
                })}
                {delta != null && <span className="spd-total__delta">{delta}</span>}
              </p>
            )}
            {/* Propriété de l'instrument, affichée dès qu'un écart est montré et
                JAMAIS confrontée à sa valeur : on donne la règle, pas le verdict. */}
            {minChange != null && previous?.totalScore != null && (
              <p className="spd-total__note">
                {t('scales.entry_detail.min_change_note', { points: minChange })}
              </p>
            )}
          </Card>

          {layout.unscored.map(row => (
            <Card
              key={row.fieldId}
              header={{ title: t('scales.entry_detail.unscored_title', { position: row.position }) }}
            >
              <p className="spd-unscored__value">
                {row.optionCode != null ? t(row.optionCode) : NO_VALUE}
              </p>
              <p className="spd-unscored__caption">{t('scales.entry_detail.unscored_caption')}</p>
            </Card>
          ))}

          <Card header={{ title: t('scales.entry_detail.follow_up_title') }}>
            {/* Accusé de lecture (#419) : la date de PREMIÈRE ouverture, celle que le
                patient voit de son côté. Absente tant que personne n'a ouvert, et
                aucun état intermédiaire ne la remplace. */}
            {passation.readAt != null && (
              <p className="spd-follow__line">
                {t('scales.entry_detail.opened_at', { date: formatDate(passation.readAt, locale) })}
              </p>
            )}
            <p className="spd-follow__line">{t('scales.entry_detail.patient_sees')}</p>
            {nextDueIso != null && (
              <p className="spd-follow__line">
                {t('scales.entry_detail.next_due', { date: formatDate(nextDueIso, locale) })}
              </p>
            )}
          </Card>
        </aside>

        <section className="spd__answers">
          <div className="spd__answers-head">
            <h5 className="spd__answers-title">
              {t('scales.entry_detail.answers_title', { count: answerCount })}
            </h5>
            {instructions !== '' && <p className="spd__instructions">{instructions}</p>}
          </div>

          <ol className="spd-rows">
            {layout.scored.map(row => <PassationRowLine key={row.fieldId} row={row} t={t} />)}
          </ol>

          {notes.map(note => (
            <aside key={note.id} className="spd-note">
              <span className="spd-note__label">{t('scales.entry_detail.instrument_note')}</span>
              <span className="spd-note__text">{t(note.text_code ?? '')}</span>
            </aside>
          ))}

          {layout.unscored.length > 0 && (
            <ol className="spd-rows spd-rows--unscored" aria-label={t('scales.entry_detail.not_scored_aria')}>
              {layout.unscored.map(row => <PassationRowLine key={row.fieldId} row={row} t={t} />)}
            </ol>
          )}

          {/* Obligation de licence, rendue indépendamment de la note ci-dessus :
              une mention due ne doit pas dépendre d'un bloc qui existe pour une
              autre raison (#417). */}
          <SourceCitation
            citation={source.citation}
            translationAttribution={source.translationAttribution}
          />
        </section>
      </div>
    </div>
  )
}
