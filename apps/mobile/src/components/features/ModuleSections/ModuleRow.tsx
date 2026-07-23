import React, { useCallback } from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { IconChip } from '@ui/IconChip'
import { colors, spacing, fonts } from '@theme'
import type { UnlockedModule } from '@services/homeService'

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name']

interface ModuleRowProps {
  mod: UnlockedModule
  title: string
  subtitle?: string
  /** Un module non disponible (`coming_soon`) est atténué et non tappable. */
  available: boolean
  comingSoonLabel: string
  /** Callback stable ; la ligne re-lie `mod` en interne pour préserver `React.memo`. */
  onSelect: (mod: UnlockedModule) => void
  /** Fond de pastille en mode ado (accent du module) ; sinon `colors.primary`. */
  accentColor?: string
}

/**
 * Ligne de module dans une carte de section. C'est une SURFACE de liste tappable
 * (pas un bouton d'action) imbriquée dans une `ui/Card` : `ui/Card onPress` ne peut
 * pas s'y appliquer (cartes imbriquées) — d'où le `Pressable` nu, cas de surface
 * explicitement toléré par le design system.
 */
export const ModuleRow = React.memo(function ModuleRow({
  mod, title, subtitle, available, comingSoonLabel, onSelect, accentColor,
}: ModuleRowProps) {
  const icon = (mod.module?.mobile_icon ?? 'help-circle-outline') as IconName
  const chipColor = available ? (accentColor ?? colors.primary) : colors.neutral
  const iconColor = available ? colors.white : colors.textMuted
  const handlePress = useCallback(() => onSelect(mod), [onSelect, mod])
  return (
    <Pressable
      style={styles.row}
      onPress={available ? handlePress : undefined}
      disabled={!available}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <IconChip color={chipColor}>
        <MaterialCommunityIcons name={icon} size={20} color={iconColor} />
      </IconChip>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        {available ? null : <Text style={styles.comingSoon}>{comingSoonLabel}</Text>}
      </View>
      {available ? (
        <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textMuted} />
      ) : null}
    </Pressable>
  )
})

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  content: { flex: 1, gap: 2 },
  title: { fontSize: 16, fontWeight: '600', color: colors.text, fontFamily: fonts.serif },
  subtitle: { fontSize: 13, color: colors.textMuted },
  comingSoon: { fontSize: 12, color: colors.primary, fontWeight: '500', marginTop: 2 },
})
