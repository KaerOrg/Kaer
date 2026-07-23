import { Platform } from 'react-native'
import { colors, spacing, radius, fontSize } from '@kaer/shared'

export { colors, spacing, radius, fontSize }
export { TEEN_DEFAULT_COLOR } from './teen'

// Familles de police. `serif` = serif système (aucun asset à bundler) : Georgia sur
// iOS, Noto Serif ('serif') sur Android/web. Utilisée pour la direction éditoriale
// des titres et libellés de l'accueil patient.
export const fonts = {
  serif: Platform.select({ ios: 'Georgia', default: 'serif' }),
} as const

export const typography = {
  h1: { fontSize: fontSize.h1, fontWeight: '700' as const, color: colors.text },
  h2: { fontSize: fontSize.h2, fontWeight: '700' as const, color: colors.text },
  h3: { fontSize: fontSize.h3, fontWeight: '600' as const, color: colors.text },
  body: { fontSize: fontSize.body, fontWeight: '400' as const, color: colors.text },
  caption: { fontSize: fontSize.caption, fontWeight: '400' as const, color: colors.textMuted },
}

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  // Ombre marquée pour les éléments flottants (FAB, feuilles bas d'écran).
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
}
