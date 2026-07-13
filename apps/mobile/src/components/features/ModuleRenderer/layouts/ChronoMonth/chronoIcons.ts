// Mapping icône des repères chronobiologiques (mobile).
// Le nom d'icône (`iconName`) est la SOURCE UNIQUE partagée web ≡ mobile
// (`CHRONO_ANCHORS` dans `@kaer/shared`) ; ce fichier ne fait que le résoudre vers
// le composant `lucide-react-native` correspondant. Aucune icône en dur ailleurs :
// frise (Journal), rythmogramme (Mensuel) et saisie lisent tous ce mapping.

import type React from 'react'
import { Footprints, Moon, Sun, Sunrise, Utensils } from 'lucide-react-native'

type LucideIcon = React.ComponentType<{ size?: number; color?: string }>

const CHRONO_ICONS: Readonly<Record<string, LucideIcon>> = {
  sunrise: Sunrise,
  utensils: Utensils,
  footprints: Footprints,
  sun: Sun,
  moon: Moon,
}

/** Résout un `iconName` de repère (`CHRONO_ANCHORS`) vers son composant lucide. */
export function resolveChronoIcon(iconName: string): LucideIcon {
  return CHRONO_ICONS[iconName] ?? Sunrise
}
