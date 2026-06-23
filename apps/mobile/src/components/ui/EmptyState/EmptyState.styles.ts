import { StyleSheet } from 'react-native'
import { colors, spacing } from '@theme'

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  icon:        { fontSize: 40, opacity: 0.4 },
  title:       { fontSize: 18, fontWeight: '600', color: colors.text, textAlign: 'center' },
  description: { fontSize: 14, color: colors.textMuted, textAlign: 'center', maxWidth: 280 },
})
