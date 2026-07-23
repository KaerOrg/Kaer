import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Avatar } from '@ui/Avatar'
import { Button } from '@ui/Button'
import { colors, spacing, radius, fonts } from '@theme'

interface ProfileIdentityHeaderProps {
  /** Nom complet du patient — les initiales de l'avatar en sont dérivées. */
  name: string
  /** Ligne d'ancienneté déjà formatée (ex. « Suivi depuis mars 2025 »). Masquée si vide. */
  sinceLabel: string
  onSettingsPress: () => void
  /** Libellé d'accessibilité du bouton réglages (roue crantée). */
  settingsLabel: string
}

const AVATAR_SIZE = 56

/**
 * En-tête d'identité compact du Profil : avatar (fond primary, initiales blanches),
 * nom serif + ancienneté, et bouton réglages (roue crantée) sur LA MÊME LIGNE. Pas
 * de marque KAER ici — l'écran gagne en hauteur utile.
 */
export const ProfileIdentityHeader = React.memo(function ProfileIdentityHeader({
  name, sinceLabel, onSettingsPress, settingsLabel,
}: ProfileIdentityHeaderProps) {
  return (
    <View style={styles.row}>
      <Avatar name={name} size={AVATAR_SIZE} backgroundColor={colors.primary} color={colors.white} />
      <View style={styles.identity}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        {sinceLabel ? <Text style={styles.since} numberOfLines={1}>{sinceLabel}</Text> : null}
      </View>
      <Button
        variant="ghost"
        style={styles.settingsBtn}
        iconLeft={<Ionicons name="settings-outline" size={20} color={colors.textMuted} />}
        onPress={onSettingsPress}
        accessibilityLabel={settingsLabel}
      />
    </View>
  )
})

const SETTINGS_SIZE = 40

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  identity: { flex: 1, flexShrink: 1 },
  name: { fontSize: 22, fontWeight: '700', color: colors.text, fontFamily: fonts.serif },
  since: { fontSize: 14, color: colors.textMuted, marginTop: 2 },
  settingsBtn: {
    width: SETTINGS_SIZE,
    height: SETTINGS_SIZE,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
  },
})
