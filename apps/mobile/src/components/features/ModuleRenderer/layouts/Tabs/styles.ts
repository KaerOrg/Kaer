import { StyleSheet } from 'react-native'
import { colors, spacing } from '@theme'

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: colors.primary },
  tabLabel: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  tabLabelActive: { color: colors.primary },
  content: { flex: 1 },
})
