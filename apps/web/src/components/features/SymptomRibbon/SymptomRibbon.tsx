import { memo } from 'react'
import { ribbonCellOpacity } from '@kaer/shared'
import './SymptomRibbon.css'

// ─── Ruban multi-symptômes : heatmap N dimensions × jours (web) ──────────────
//
// Miroir du composant mobile (#161) : remplace l'ancienne vue mensuelle
// mono-score. Chaque cellule porte UNE teinte (celle de la dimension), opacité
// proportionnelle à la valeur brute (magnitude seule, MDR 2017/745). Jour non
// renseigné = cellule vide à contour clair : les lacunes se lisent d'un coup
// d'œil, aucune valeur n'est inventée. Générique : ne connaît aucun module, les
// dimensions/couleurs/libellés sont fournis par l'appelant.
//
// Largeur fluide : la colonne de libellés est bornée, les cellules sont `flex: 1`,
// jamais de scroll horizontal, quel que soit le nombre de jours.

export interface RibbonRow {
  readonly key: string
  readonly label: string
  /** Teinte de la dimension. */
  readonly color: string
  /** Une valeur par jour ; null = jour non renseigné. */
  readonly values: readonly (number | null)[]
}

export interface SymptomRibbonProps {
  readonly rows: readonly RibbonRow[]
  /** Borne haute de l'échelle (10 pour mood_tracker). */
  readonly yMax: number
  /** Ex. « Vue par symptôme » (résolu par le parent). */
  readonly title: string
  /** Ex. « 22/30 saisis » (résolu par le parent). */
  readonly assiduityLabel: string
  readonly legendLabel: string
}

export const SymptomRibbon = memo(function SymptomRibbon({
  rows, yMax, title, assiduityLabel, legendLabel,
}: SymptomRibbonProps) {
  return (
    <div className="symptom-ribbon">
      <div className="symptom-ribbon__header">
        <span className="symptom-ribbon__title">{title}</span>
        <span className="symptom-ribbon__assiduity">{assiduityLabel}</span>
      </div>

      <div className="symptom-ribbon__grid">
        {rows.map(row => (
          <div key={row.key} className="symptom-ribbon__row">
            <span className="symptom-ribbon__row-label">
              <span className="symptom-ribbon__dot" style={{ background: row.color }} />
              <span className="symptom-ribbon__dim">{row.label}</span>
            </span>
            <span className="symptom-ribbon__cells">
              {row.values.map((value, i) => {
                const opacity = ribbonCellOpacity(value, yMax)
                return (
                  <span
                    key={i}
                    className={`symptom-ribbon__cell${opacity == null ? ' symptom-ribbon__cell--empty' : ''}`}
                    style={opacity == null ? undefined : { background: row.color, opacity }}
                    data-testid={opacity == null ? 'ribbon-cell-empty' : 'ribbon-cell'}
                  />
                )
              })}
            </span>
          </div>
        ))}
      </div>

      <span className="symptom-ribbon__legend">{legendLabel}</span>
    </div>
  )
})
