import { StyleSheet } from 'react-native'
import { spacing } from '@theme'

export const styles = StyleSheet.create({
  stepsContainer: { gap: spacing.md },
  stepRow:        { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  stepBadge:      { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  stepNum:        { fontSize: 13, fontWeight: '700', color: '#fff' },
  stepContent:    { flex: 1 },
})
