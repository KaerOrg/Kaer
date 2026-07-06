import type { ContentField } from '../index'

// Schéma des modules `column_form` (colonnes de Beck, chronobiologie…) — source
// UNIQUE web ≡ mobile de « quels champs sont des colonnes et comment ordonner
// leurs enfants ». Évite trois copies (aperçu web, panneau données web, layout
// mobile) qui pourraient diverger (ex. ajout d'un 4e type d'enfant de colonne).

// Types de champs enfants d'une colonne (widgets rendus dans une colonne).
export const CHILD_FIELD_TYPES: ReadonlySet<string> = new Set([
  'column_text_field',
  'column_slider_field',
  'column_time_field',
])

export interface ColumnSpec {
  header: ContentField
  children: ContentField[]
}

/** Colonnes du module : chaque `column_header` (trié) + ses enfants widgets triés. */
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

export interface SliderParams {
  min: number
  max: number
  step: number
}

/** Bornes d'un `column_slider_field` depuis ses props (défauts 0-100, pas 10). */
export function readSliderParams(field: ContentField): SliderParams {
  return {
    min: parseInt(field.props['min'] ?? '0', 10),
    max: parseInt(field.props['max'] ?? '100', 10),
    step: parseInt(field.props['step'] ?? '10', 10),
  }
}
