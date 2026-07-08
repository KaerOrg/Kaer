import { StyleSheet } from 'react-native'
import { colors, spacing, radius, shadows } from '@theme'

// Géométrie intrinsèque du widget (comme les tailles de pip de RatingSelector) :
// dimensions propres au curseur, indépendantes des tokens d'espacement.
const TRACK_HEIGHT = 6
const THUMB_SIZE = 22

export const styles = StyleSheet.create({
  container: { gap: spacing.xs },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label:  { fontSize: 14, fontWeight: '600', color: colors.text },
  value:  { fontSize: 16, fontWeight: '700' },

  // Zone tactile généreuse ; la barre est centrée dedans (le thumb déborde).
  track: { height: THUMB_SIZE + spacing.sm, justifyContent: 'center' },
  bar:   { flexDirection: 'row', height: TRACK_HEIGHT, borderRadius: radius.full, backgroundColor: colors.border, alignItems: 'center' },

  // Remplissage proportionnel (flex: ratio) — le thumb est ancré à son bord droit
  // en absolu, comme la jauge de RatingSelector : aucun positionnement en %.
  fill:  { height: TRACK_HEIGHT, borderRadius: radius.full, position: 'relative' },
  empty: { height: TRACK_HEIGHT },
  thumb: {
    position: 'absolute',
    right: -THUMB_SIZE / 2,
    top: TRACK_HEIGHT / 2 - THUMB_SIZE / 2,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    borderWidth: 2,
    borderColor: colors.white,
    ...shadows.sm,
  },

  endLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  endLabel:  { fontSize: 11, color: colors.textMuted },
})
