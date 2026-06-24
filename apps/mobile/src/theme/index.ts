import { colors, spacing, radius, fontSize } from '@kaer/shared'

export { colors, spacing, radius, fontSize }
export { TEEN_DEFAULT_COLOR } from './teen'

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
}
