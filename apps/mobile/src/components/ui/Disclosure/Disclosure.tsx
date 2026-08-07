import React, { useCallback } from 'react'
import { View, Text, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { colors, spacing, radius, fontSize } from '@theme'

export interface DisclosureProps {
  /** Libellé de l'en-tête, toujours visible. */
  label: string
  /** Contenu révélé. Rendu uniquement quand `open` est vrai. */
  children: React.ReactNode
  open: boolean
  onToggle: (open: boolean) => void
  style?: StyleProp<ViewStyle>
  testID?: string
}

/**
 * Bloc repliable : un en-tête cliquable, un contenu révélé à la demande.
 *
 * Contrôlé (`open` + `onToggle`) plutôt qu'autonome : l'ouverture est souvent une
 * information que le parent veut connaître ou piloter, et un état interne caché rend
 * le composant intestable depuis l'extérieur.
 *
 * Sert quand une information doit rester **accessible sans être imposée** : un chiffre
 * qu'on ne met pas sous les yeux, un détail secondaire. C'est une décision de posture,
 * pas un gain de place.
 */
export const Disclosure = React.memo(function Disclosure({
  label, children, open, onToggle, style, testID,
}: DisclosureProps) {
  const handlePress = useCallback(() => onToggle(!open), [onToggle, open])

  return (
    <View style={style} testID={testID}>
      <Pressable
        style={styles.header}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={label}
      >
        <Text style={styles.label}>{label}</Text>
        <MaterialCommunityIcons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.textMuted}
        />
      </Pressable>
      {open ? <View style={styles.body}>{children}</View> : null}
    </View>
  )
})

export default Disclosure

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    minHeight: 52,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
  },
  label: { flex: 1, fontSize: fontSize.label, color: colors.text },
  body:  { marginTop: spacing.xs },
})
