// Écran de première ouverture du module (E2, ticket #250).
//
// Écran PLEIN, affiché une seule fois, jamais revu ensuite. Ce n'est volontairement
// pas une modale : une modale se balaie par réflexe, et ce contenu dit au patient ce
// que deviennent ses notes. Il reste consultable à tout moment dans la fiche ⓘ.
//
// « J'ai compris » est un accusé de lecture, PAS un consentement : rien n'est
// journalisé, aucun objet de consentement (version, retrait, révocation) n'est créé.
// En fabriquer un obligerait ensuite à le gérer, pour une information qui n'en demande
// pas.
//
// Contenu 100 % config-first : titre, points et bouton viennent de `field_props`.

import { ScrollView, Text, View, StyleSheet } from 'react-native'
import { colors, spacing, radius, fontSize } from '@theme'
import { Button } from '@ui/Button'

export interface WelcomeTexts {
  title: string
  intro: string
  /** Points forts : ce que deviennent les notes, et la liberté de les effacer. */
  points: string[]
  crisis: string
  ackBtn: string
  /** Rappel de bas d'écran : tout se retrouve dans la fiche ⓘ. */
  footer: string
}

interface TreeSelectorWelcomeProps {
  texts: WelcomeTexts
  onAcknowledge: () => void
}

export function TreeSelectorWelcome({ texts, onAcknowledge }: TreeSelectorWelcomeProps) {
  return (
    <View style={styles.container} testID="module-welcome">
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{texts.title}</Text>
        {texts.intro ? <Text style={styles.intro}>{texts.intro}</Text> : null}

        {texts.points.length > 0 ? (
          <View style={styles.points}>
            {texts.points.map(point => (
              <View key={point} style={styles.point}>
                <View style={styles.bullet} />
                <Text style={styles.pointText}>{point}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {texts.crisis ? (
          <View style={styles.crisisBox}>
            <Text style={styles.crisisText}>{texts.crisis}</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footerZone}>
        <Button label={texts.ackBtn} onPress={onAcknowledge} testID="acknowledge-welcome" />
        {texts.footer ? <Text style={styles.footerNote}>{texts.footer}</Text> : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content:   { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl },
  title:     { fontSize: fontSize.h1, fontWeight: '700', color: colors.text },
  intro:     { fontSize: fontSize.body, color: colors.text, lineHeight: 24 },
  points:    { gap: spacing.md, backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md },
  point:     { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  bullet: {
    width: 6, height: 6, borderRadius: radius.full,
    backgroundColor: colors.primary, marginTop: 8,
  },
  pointText: { flex: 1, flexShrink: 1, fontSize: fontSize.caption, color: colors.text, lineHeight: 21 },
  crisisBox: { backgroundColor: colors.neutral, borderRadius: radius.lg, padding: spacing.md },
  crisisText: { fontSize: fontSize.caption, color: colors.text, lineHeight: 21 },
  footerZone: { padding: spacing.lg, gap: spacing.sm },
  footerNote: {
    fontSize: fontSize.xs, color: colors.textMuted, textAlign: 'center',
    fontStyle: 'italic', lineHeight: 17,
  },
})
