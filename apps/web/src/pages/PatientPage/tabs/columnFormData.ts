import type { ContentField } from '@services/moduleService'
import type { FormEntryRow } from '@services/engagementService'

// Helpers purs du panneau « Données » des modules `column_form` : dérivent la
// structure (colonnes, curseurs) depuis `module_content_fields` — zéro hardcode
// d'un module particulier (config-first). Valeurs brutes uniquement (MDR).

export interface ColumnSpec {
  header: ContentField
  children: ContentField[]
}

export interface SliderSpec {
  key: string
  labelCode: string | null
  min: number
  max: number
}

const CHILD_FIELD_TYPES = new Set([
  'column_text_field',
  'column_slider_field',
  'column_time_field',
])

/** Colonnes du module : chaque `column_header` + ses champs enfants triés. */
export function buildColumnSpecs(fields: ContentField[]): ColumnSpec[] {
  return fields
    .filter(f => f.field_type === 'column_header')
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(header => ({
      header,
      children: (header.children ?? [])
        .filter(c => CHILD_FIELD_TYPES.has(c.field_type))
        .sort((a, b) => a.sort_order - b.sort_order),
    }))
}

/** Tous les curseurs du module, dans l'ordre des colonnes (séries du graphique). */
export function buildSliderSpecs(columns: ColumnSpec[]): SliderSpec[] {
  const sliders: SliderSpec[] = []
  for (const col of columns) {
    for (const child of col.children) {
      if (child.field_type !== 'column_slider_field') continue
      const key = child.props['key']
      if (!key) continue
      sliders.push({
        key,
        labelCode: child.text_code,
        min: parseInt(child.props['min'] ?? '0', 10),
        max: parseInt(child.props['max'] ?? '100', 10),
      })
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
