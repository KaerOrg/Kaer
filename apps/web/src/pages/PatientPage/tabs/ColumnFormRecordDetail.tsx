import { memo, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { isFilledValue } from '@kaer/shared'
import { Button } from '@ui/Button'
import type { FormEntryRow } from '@services/engagementService'
import {
  BECK_MOVEMENTS,
  BECK_EMOTION_KEY,
  SUMMARIZED_KEYS,
  readMovement,
  findSliderColor,
  formatEntryDate,
  formatEntryDateShort,
  type ColumnSpec,
} from './columnFormData'

interface Props {
  entry: FormEntryRow
  columns: ColumnSpec[]
  locale: string
  t: (key: string) => string
  onOlder: () => void
  onNewer: () => void
  /** Fiche plus ancienne disponible (index suivant dans l'ordre antichronologique). */
  olderDate: string | null
  /** Fiche plus récente disponible (index précédent). */
  newerDate: string | null
}

/**
 * Détail d'une saisie `column_form` (vue praticien) : en-tête daté + navigation
 * entre saisies, cartes du mouvement de restructuration (avant→après, valeurs
 * brutes), puis grille des colonnes avec le texte intégral du patient (titres et
 * couleurs issus de la config). Présentationnel pur. Conforme MDR 2017/745 :
 * restitution neutre, delta = simple différence arithmétique (score pour le
 * praticien), aucun seuil ni couleur de jugement : les couleurs codent
 * l'identité de colonne.
 */
function ColumnFormRecordDetailBase({
  entry, columns, locale, t, onOlder, onNewer, olderDate, newerDate,
}: Props) {
  const emotion = entry.values[BECK_EMOTION_KEY]

  const movements = useMemo(
    () => BECK_MOVEMENTS
      .map(m => ({ m, values: readMovement(entry, m), color: findSliderColor(columns, m.beforeKey) ?? 'var(--color-primary)' }))
      .filter(({ values }) => values.before != null || values.after != null),
    [entry, columns],
  )

  // Voisins disponibles, joints pour l'étiquette de navigation (plus ancien puis plus récent).
  const navLabel = useMemo(() => {
    const parts: string[] = []
    if (olderDate !== null) parts.push(formatEntryDateShort(olderDate, locale))
    if (newerDate !== null) parts.push(formatEntryDateShort(newerDate, locale))
    return parts.join(' · ')
  }, [olderDate, newerDate, locale])

  return (
    <div className="cfd-detail">
      <header className="cfd-detail__header">
        <h4 className="cfd-detail__date">
          {t('patient.beck_entry_of')} {formatEntryDate(entry.date, locale)}
        </h4>
        <div className="cfd-detail__nav">
          <Button
            variant="ghost"
            size="xs"
            icon={<ChevronLeft size={15} />}
            disabled={olderDate === null}
            onClick={onOlder}
            aria-label={t('patient.beck_older')}
          />
          <span className="cfd-detail__nav-label">{navLabel}</span>
          <Button
            variant="ghost"
            size="xs"
            icon={<ChevronRight size={15} />}
            disabled={newerDate === null}
            onClick={onNewer}
            aria-label={t('patient.beck_newer')}
          />
        </div>
      </header>

      {movements.length > 0 && (
        <div className="cfd-moves">
          {movements.map(({ m, values, color }) => {
            const isIntensity = m.beforeKey === BECK_MOVEMENTS[0].beforeKey
            const caption = isIntensity && typeof emotion === 'string' && emotion.trim() !== '' ? emotion : null
            return (
              <section key={m.beforeKey} className="cfd-move" style={{ borderColor: color }}>
                <div className="cfd-move__head">
                  <span className="cfd-move__title" style={{ color }}>{t(m.titleCode)}</span>
                  {caption !== null && <span className="cfd-move__caption">{caption}</span>}
                </div>
                <div className="cfd-move__values">
                  <div className="cfd-move__side">
                    <span className="cfd-move__label">{t(m.beforeCode)}</span>
                    <span className="cfd-move__value" style={{ color }}>
                      {values.before != null ? values.before : '-'}
                    </span>
                  </div>
                  <span className="cfd-move__arrow" style={{ color }} aria-hidden="true">→</span>
                  <div className="cfd-move__side">
                    <span className="cfd-move__label">{t(m.afterCode)}</span>
                    <span className="cfd-move__value" style={{ color }}>
                      {values.after != null ? values.after : '-'}
                    </span>
                  </div>
                  {values.delta != null && (
                    <span className="cfd-move__delta">{values.delta > 0 ? `+${values.delta}` : values.delta}</span>
                  )}
                </div>
              </section>
            )
          })}
        </div>
      )}

      <div className="cfd-cols">
        {columns.map(col => {
          const accent = col.header.props['color'] ?? 'var(--color-primary)'
          const filled = col.children
            .map(child => ({ child, value: child.props['key'] ? entry.values[child.props['key']] : undefined }))
            .filter(({ child, value }) =>
              isFilledValue(value) && !(child.props['key'] != null && SUMMARIZED_KEYS.has(child.props['key'])))
          if (filled.length === 0) return null
          return (
            <section key={col.header.id} className="cfd-col">
              <h5 className="cfd-col__title" style={{ color: accent }}>
                {col.header.text_code ? t(col.header.text_code) : ''}
              </h5>
              {filled.map(({ child, value }) => {
                if (child.field_type === 'column_text_field') {
                  return <p key={child.id} className="cfd-col__text">{value}</p>
                }
                return (
                  <div key={child.id} className="cfd-col__value-row">
                    <span className="cfd-col__value-label">{child.text_code ? t(child.text_code) : ''}</span>
                    <span className="cfd-col__value">{value}</span>
                  </div>
                )
              })}
            </section>
          )
        })}
      </div>
    </div>
  )
}

export const ColumnFormRecordDetail = memo(ColumnFormRecordDetailBase)
