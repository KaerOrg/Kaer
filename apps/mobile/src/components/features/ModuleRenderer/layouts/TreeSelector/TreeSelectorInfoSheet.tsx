// Fiche ⓘ du module (écran E3b, ticket #251) : à quoi ça sert, qui voit quoi, en cas
// de crise, sources.
//
// Elle recueille ce qui était collé en permanence sur l'accueil — bandeau de
// psychoéducation et pavé de disclaimer sourcé — et le rend disponible à la demande.
// Un contenu permanent qu'on ne lit plus ne protège personne ; un contenu atteignable
// en un tap reste consultable quand la question se pose.
//
// Contenu 100 % config-first : les sections viennent de `field_props` (clés indexées
// `info_title_N` / `info_body_N`), aucune prose dans le composant.

import { Modal, ScrollView, Text, View } from 'react-native'
import { colors, spacing, radius, fontSize } from '@theme'
import { StyleSheet } from 'react-native'
import { Button } from '@ui/Button'

export interface InfoSection {
  title: string
  body: string
}

interface TreeSelectorInfoSheetProps {
  visible: boolean
  /** Titre de la fiche (« À propos de ce module »). */
  title: string
  sections: InfoSection[]
  closeLabel: string
  onClose: () => void
}

export function TreeSelectorInfoSheet({
  visible, title, sections, closeLabel, onClose,
}: TreeSelectorInfoSheetProps) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent={false}>
      <View style={styles.container} testID="info-sheet">
        <ScrollView contentContainerStyle={styles.content}>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {sections.map(section => (
            <View key={section.title} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionBody}>{section.body}</Text>
            </View>
          ))}
        </ScrollView>
        <View style={styles.footer}>
          <Button label={closeLabel} onPress={onClose} testID="close-info" />
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content:   { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl },
  title:     { fontSize: fontSize.h2, fontWeight: '700', color: colors.text },
  section:   { gap: spacing.xs },
  sectionTitle: {
    fontSize: fontSize.xs, fontWeight: '700', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  sectionBody: { fontSize: fontSize.caption, color: colors.text, lineHeight: 21 },
  footer: {
    padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border,
    backgroundColor: colors.card, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg,
  },
})
