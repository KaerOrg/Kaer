// Helpers purs de la frise 24 h du Journal chronobiologique.
// Aucune dépendance React : lecture des repères d'une saisie → marqueurs positionnés.
// Conforme MDR 2017/745 : horaires bruts uniquement, aucun seuil ni jugement.

import { CHRONO_ANCHORS } from '@kaer/shared'
import { timeToFraction } from '../ChronoMonth/chronoMonthUtils'

export interface FriseMarker {
  /** Clé du repère (`wake_time`…) — source `form_entries.values`. */
  readonly key: string
  /** Couleur d'accent du repère (source unique `CHRONO_ANCHORS`). */
  readonly color: string
  /** Nom d'icône lucide du repère (source unique `CHRONO_ANCHORS`). */
  readonly iconName: string
  /** Clé i18n du libellé court du repère. */
  readonly labelCode: string
  /** Horaire brut « HH:MM » tel que saisi. */
  readonly time: string
  /** Position horizontale sur la frise 0 h → 24 h, en pourcentage (0 à 100). */
  readonly leftPct: number
}

const TIME_RE = /^\d{1,2}:\d{2}$/

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

/**
 * Marqueurs de la frise pour une saisie : un repère par ancre RENSEIGNÉE
 * (valeur « HH:MM » valide), dans l'ordre canonique de `CHRONO_ANCHORS`.
 * Les ancres non renseignées ne produisent aucun marqueur (pas de placeholder).
 */
export function buildDayMarkers(values: Readonly<Record<string, string | number>>): FriseMarker[] {
  const markers: FriseMarker[] = []
  for (const anchor of CHRONO_ANCHORS) {
    const raw = values[anchor.key]
    if (typeof raw !== 'string' || !TIME_RE.test(raw)) continue
    markers.push({
      key: anchor.key,
      color: anchor.color,
      iconName: anchor.iconName,
      labelCode: anchor.labelCode,
      time: raw,
      leftPct: timeToFraction(raw) * 100,
    })
  }
  return markers
}
