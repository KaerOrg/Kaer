import React, { useMemo } from 'react'
import { Text, StyleSheet, Pressable } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { IconChip } from '@ui/IconChip'
import { colors, spacing } from '@theme'
import type { RegisterItem } from './types'

interface RegisterRowProps {
  item: RegisterItem
}

/**
 * Ligne d'une liste-registre. SURFACE de liste tappable (pas un bouton d'action)
 * imbriquée dans une `ui/Card` : `ui/Card onPress` ne peut pas s'y appliquer
 * (cartes imbriquées) — d'où le `Pressable` nu, cas de surface explicitement
 * toléré par le design system.
 */
export const RegisterRow = React.memo(function RegisterRow({ item }: RegisterRowProps) {
  const labelStyle = useMemo(
    () => [styles.label, item.labelColor ? { color: item.labelColor } : null],
    [item.labelColor],
  )
  return (
    <Pressable
      style={styles.row}
      onPress={item.onPress}
      accessibilityRole="button"
      accessibilityLabel={item.label}
    >
      <IconChip color={item.chipColor}>{item.icon}</IconChip>
      <Text style={labelStyle}>{item.label}</Text>
      {item.showChevron !== false ? (
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
    minHeight: 56,
  },
  label: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.text },
})
