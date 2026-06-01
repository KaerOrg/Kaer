import { StyleSheet } from 'react-native'
import { spacing, radius } from '../../../../../theme'

export const styles = StyleSheet.create({
  scroll:       { padding: spacing.md, paddingBottom: spacing.xl, gap: spacing.md },
  callSection:  { gap: spacing.sm, marginBottom: spacing.md },
  callBtn: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: radius.lg, padding: spacing.md, gap: spacing.md,
  },
  callLabel:    { color: '#fff', fontSize: 16, fontWeight: '700', lineHeight: 22 },
  callSub:      { color: 'rgba(255,255,255,0.85)', fontSize: 12, lineHeight: 16 },
})
