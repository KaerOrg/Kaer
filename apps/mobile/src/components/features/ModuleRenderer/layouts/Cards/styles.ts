import { StyleSheet } from 'react-native'
import { colors } from '@theme'

export const styles = StyleSheet.create({
  divider:           { height: 1, backgroundColor: '#E5E7EB', marginVertical: 12 },
  listBlock:         { gap: 2 },
  cardsBlock:        { gap: 8 },
  card:              { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, overflow: 'hidden' },
  cardHeader:        { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 8 },
  cardMeta:          { flex: 1 },
  cardFallbackTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  cardBody:          { padding: 14, paddingTop: 0, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
})
