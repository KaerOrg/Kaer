import { StyleSheet } from 'react-native'
import { colors, radius, spacing, fontSize } from '@theme'

export const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  backdropTap: { flex: 1 },
  sheet: {
    width: '100%',
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 16,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  title: { fontSize: fontSize.h3, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: fontSize.caption, color: colors.textMuted, marginTop: spacing.xs, lineHeight: 20 },
  header: { marginBottom: spacing.md },
  body: { gap: spacing.md, paddingBottom: spacing.sm },
})
