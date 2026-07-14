// Helpers purs de la frise 24 h du Journal chronobiologique (mobile).
// `buildDayMarkers` + `FriseMarker` vivent dans `@kaer/shared` (source UNIQUE de
// placement web ≡ mobile) et sont ré-exportés ici pour les consommateurs mobiles.
// La détection « config en frise » (`isTimelineConfig`) reste locale : elle dépend
// de la forme des colonnes `column_form` propre au layout mobile.
// Conforme MDR 2017/745 : horaires bruts uniquement, aucun seuil ni jugement.

export { buildDayMarkers } from '@kaer/shared'
export type { FriseMarker } from '@kaer/shared'

/** Une colonne « part » de la liste : suffit d'en connaître les compteurs par type. */
export interface TimelineColumnShape {
  readonly textChildren: readonly unknown[]
  readonly sliderChildren: readonly unknown[]
  readonly timeChildren: readonly unknown[]
}

/**
 * Vrai quand toutes les colonnes visibles ne portent QUE des champs horaires
 * (repères d'ancrage) → la liste s'affiche en frise 24 h. Les autres modules
 * `column_form` (ex. craving_journal : slider + textes) sont exclus. Détection
 * structurelle : aucun flag de config à ajouter au seed.
 */
export function isTimelineConfig(parts: readonly TimelineColumnShape[]): boolean {
  return (
    parts.length > 0 &&
    parts.every(
      p => p.timeChildren.length > 0 && p.textChildren.length === 0 && p.sliderChildren.length === 0,
    )
  )
}
