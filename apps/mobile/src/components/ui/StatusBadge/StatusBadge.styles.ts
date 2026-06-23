import { StyleSheet } from 'react-native'
import { colors, radius } from '@theme'

const VARIANT_COLORS = {
  neutral: { bg: colors.neutral,       text: colors.textMuted   },
  info:    { bg: colors.primaryLight,  text: colors.primary     },
  success: { bg: colors.successLight,  text: colors.success     },
  warning: { bg: colors.warningLight,  text: '#92400E'          },
  danger:  { bg: colors.dangerLight,   text: colors.danger      },
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
