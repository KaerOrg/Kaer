import React, { type ReactNode } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Button } from '@ui/Button'
import { colors, spacing, radius, fonts } from '@theme'

export interface BrandHeaderAction {
  /** Icône affichée dans le bouton rond (couleur gérée par l'appelant). */
  icon: ReactNode
  onPress: () => void
  /** Obligatoire : le bouton n'a pas de libellé texte. */
  accessibilityLabel: string
}

interface BrandHeaderProps {
  /** Bouton rond optionnel à droite (profil sur l'accueil, réglages sur le profil). */
  rightAction?: BrandHeaderAction
}

/**
 * En-tête de marque de l'app patient : pastille logo « k » + wordmark « KAER »,
 * et un bouton d'action rond optionnel à droite. Réutilisé sur les écrans patient
 * (accueil, profil…) — l'action de droite change selon l'écran.
 *
 * « KAER » / « k » sont l'identité de marque (nom propre / logo) : non traduits.
 */
export const BrandHeader = React.memo(function BrandHeader({ rightAction }: BrandHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.brand}>
        <View style={styles.logo}>
          <Text style={styles.logoLetter}>k</Text>
        </View>
        <Text style={styles.wordmark}>KAER</Text>
      </View>
      {rightAction ? (
        <Button
          variant="ghost"
          style={styles.actionBtn}
          iconLeft={rightAction.icon}
          onPress={rightAction.onPress}
          accessibilityLabel={rightAction.accessibilityLabel}
        />
      ) : null}
    </View>
  )
})

const LOGO_SIZE = 40
const ACTION_SIZE = 40

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: { color: colors.white, fontSize: 22, fontWeight: '700', fontFamily: fonts.serif },
  wordmark: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 3.2,
    textTransform: 'uppercase',
  },
  actionBtn: {
    width: ACTION_SIZE,
    height: ACTION_SIZE,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
  },
})
