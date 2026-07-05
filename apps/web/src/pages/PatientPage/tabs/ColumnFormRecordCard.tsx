import type { FormEntryRow } from '@services/engagementService'
import type { ColumnSpec } from './columnFormData'

interface Props {
  entry: FormEntryRow
  columns: ColumnSpec[]
  locale: string
  t: (key: string) => string
}

/**
 * Fiche complète d'une saisie `column_form` (vue praticien) : chaque colonne
 * renseignée avec ses textes intégraux et ses valeurs de curseurs brutes.
 * Présentationnel pur. Conforme MDR 2017/745 : restitution neutre, aucun
 * seuil ni label interprétatif — les accents de colonne viennent de la config.
 */
export function ColumnFormRecordCard({ entry, columns, locale, t }: Props) {
  const dateLabel = new Date(entry.date).toLocaleDateString(locale, { dateStyle: 'long' })

  return (
    <article className="cfd-record">
      <header className="cfd-record__date">{dateLabel}</header>
      {columns.map(col => {
        const accent = col.header.props['color'] ?? 'var(--color-primary)'
        const filled = col.children.filter(child => {
          const key = child.props['key']
          const value = key ? entry.values[key] : undefined
          return typeof value === 'number' || (typeof value === 'string' && value.trim() !== '')
        })
        if (filled.length === 0) return null
        return (
          <section key={col.header.id} className="cfd-record__column">
            <h5 className="cfd-record__column-title" style={{ color: accent }}>
              {col.header.text_code ? t(col.header.text_code) : ''}
            </h5>
            {filled.map(child => {
              const key = child.props['key']
              const value = key ? entry.values[key] : undefined
              const label = child.text_code ? t(child.text_code) : ''
              // Curseur ou horaire : paire libellé + valeur brute. Texte : intégral.
              if (child.field_type !== 'column_text_field') {
                return (
                  <div key={child.id} className="cfd-record__value-row">
                    <span className="cfd-record__value-label">{label}</span>
                    <span className="cfd-record__value">{value}</span>
                  </div>
                )
              }
              return (
                <p key={child.id} className="cfd-record__text">{value}</p>
              )
            })}
          </section>
        )
      })}
    </article>
  )
}
