// Frise 24 h chronobiologique : marqueurs positionnés à l'heure, SOURCE UNIQUE
// web ≡ mobile. Aucune dépendance UI : lecture des repères d'une saisie → marqueurs
// placés sur l'axe 0 h → 24 h. Le placement identique des deux côtés garantit la
// parité stricte (Journal patient mobile ≡ aperçu praticien web).
// MDR 2017/745 : horaires bruts uniquement, aucun seuil ni jugement.

import { CHRONO_ANCHORS } from './chronoAnchors'
import { parseTimeToMinutes } from './rhythmogram'

const MIN_PER_DAY = 1440

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

/**
 * Marqueurs de la frise pour une saisie : un repère par ancre RENSEIGNÉE (valeur
 * « HH:MM » valide), dans l'ordre canonique de `CHRONO_ANCHORS`. Les ancres non
 * renseignées ne produisent aucun marqueur (pas de placeholder).
 */
export function buildDayMarkers(
  // Valeurs de formulaire opaques (élargies #204 : peuvent porter booléens / listes).
  // Chaque ancre est narrowée à une chaîne d'horaire avant usage.
  values: Readonly<Record<string, unknown>>,
): FriseMarker[] {
  const markers: FriseMarker[] = []
  for (const anchor of CHRONO_ANCHORS) {
    const raw = values[anchor.key]
    if (typeof raw !== 'string') continue
    const minutes = parseTimeToMinutes(raw)
    if (minutes === null) continue
    markers.push({
      key: anchor.key,
      color: anchor.color,
      iconName: anchor.iconName,
      labelCode: anchor.labelCode,
      time: raw,
      leftPct: (minutes / MIN_PER_DAY) * 100,
    })
  }
  return markers
}
