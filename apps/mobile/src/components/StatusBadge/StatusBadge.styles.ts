import { StyleSheet } from 'react-native'
import { colors, radius } from '../../theme'

const VARIANT_COLORS = {
  neutral: { bg: colors.background,    text: colors.textMuted   },
  info:    { bg: colors.primaryLight,  text: colors.primary     },
  success: { bg: '#D1FAE5',            text: colors.success     },
  warning: { bg: '#FEF3C7',            text: '#92400E'          },
  danger:  { bg: '#FEE2E2',            text: colors.danger      },
} as const

export { VARIANT_COLORS }

export const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  icon:  { fontSize: 13 },
  label: { fontSize: 12, fontWeight: '500' },
  value: { fontSize: 12, fontWeight: '700' },
})
