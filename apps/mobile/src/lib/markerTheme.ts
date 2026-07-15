import { colors } from '@theme'
import type { MarkerType } from './database'

// Liste fermée des types de repère (runtime). Vit ici, hors de la couche DB, pour
// rester disponible même quand `lib/database` est mocké dans les tests d'écran.
export const MARKER_TYPES: readonly MarkerType[] = ['treatment', 'life_event', 'other']

// Couleur d'identité d'un type de repère (puce / point). Encode le TYPE, pas une
// gravité clinique (MDR). Partagée par la modale d'ajout et la liste des repères.
export const MARKER_TYPE_COLORS: Record<MarkerType, string> = {
  treatment: '#4FA5A9',   // Traitement — teal
  life_event: '#9C89D6',  // Événement de vie — violet
  other: colors.neutralBar, // Autre — gris neutre
}

// Icône MaterialCommunityIcons par type (identité visuelle, pas de sémantique).
export const MARKER_TYPE_ICONS: Record<MarkerType, string> = {
  treatment: 'pill',
  life_event: 'calendar-star',
  other: 'tag-outline',
}
