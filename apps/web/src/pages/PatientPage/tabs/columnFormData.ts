import { buildColumnSpecs, readSliderParams, type ColumnSpec } from '@kaer/shared'
import type { FormEntryRow } from '@services/engagementService'

// Helpers purs du panneau « Données » des modules `column_form` : dérivent la
// structure (colonnes, curseurs) depuis `module_content_fields` — zéro hardcode
// d'un module particulier (config-first). Valeurs brutes uniquement (MDR).
// La construction des colonnes vient de `@kaer/shared` (source unique web ≡ mobile).

export { buildColumnSpecs, type ColumnSpec }

export interface SliderSpec {
  key: string
  labelCode: string | null
  min: number
  max: number
}

/** Tous les curseurs du module, dans l'ordre des colonnes (séries du graphique). */
export function buildSliderSpecs(columns: ColumnSpec[]): SliderSpec[] {
  const sliders: SliderSpec[] = []
  for (const col of columns) {
    for (const child of col.children) {
      if (child.field_type !== 'column_slider_field') continue
      const key = child.props['key']
      if (!key) continue
      const { min, max } = readSliderParams(child)
      sliders.push({ key, labelCode: child.text_code, min, max })
    }
  }
  return sliders
}

/** Points du graphique : une ligne par fiche portant au moins une valeur de curseur. */
export function buildChartData(
  entries: FormEntryRow[],
  sliders: SliderSpec[],
): Record<string, number | string>[] {
  const rows: Record<string, number | string>[] = []
  for (const entry of entries) {
    const row: Record<string, number | string> = { date: entry.date }
    let hasValue = false
    for (const slider of sliders) {
      const value = entry.values[slider.key]
      if (typeof value === 'number' && Number.isFinite(value)) {
        row[slider.key] = value
        hasValue = true
      }
    }
    if (hasValue) rows.push(row)
  }
  return rows
}

/** Étendue Y englobant tous les curseurs (défaut 0-100 sans curseur). */
export function chartYDomain(sliders: SliderSpec[]): [number, number] {
  if (sliders.length === 0) return [0, 100]
  return [
    Math.min(...sliders.map(s => s.min)),
    Math.max(...sliders.map(s => s.max)),
  ]
}
