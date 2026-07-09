// ─── CallableContact : rangée de contact appelable (lecture seule) ───────────
//
// Affiche un contact du plan de sécurité (proche/pro, étapes 4 & 5) : son nom et,
// s'il porte un numéro, un bouton d'appel `tel:` (primitive `@ui/Button`). Utilisé
// par la vue de consultation `SafetyPlanLayout`. Un contact sans numéro reste
// affiché comme une simple ligne (puce + nom).
//
// Conformité MDR 2017/745 : raccourci d'appel du contact choisi par le patient,
// zéro interprétation.

import { View, Text, StyleSheet, Linking } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { colors, spacing } from '@theme'
import { Button } from '@ui/Button'

export interface CallableContactProps {
  /** Nom du contact (texte de l'item du plan). */
  name: string
  /** Numéro de téléphone, ou null/'' si le contact n'en a pas. */
  phone: string | null
  /** Couleur d'accent de l'étape (puce + bouton d'appel). */
  accentColor: string
  /** Libellé d'accessibilité du bouton d'appel (i18n, fourni par le parent). */
  callAccessibilityLabel: string
  testID?: string
}

export function CallableContact({ name, phone, accentColor, callAccessibilityLabel, testID }: CallableContactProps) {
  const hasPhone = phone != null && phone !== ''

  return (
    <View style={styles.row} testID={testID}>
      <MaterialCommunityIcons name="circle-small" size={20} color={accentColor} />
      <Text style={styles.name}>{name}</Text>
      {hasPhone ? (
        <Button
          variant="secondary"
          size="sm"
          iconLeft={<MaterialCommunityIcons name="phone" size={16} color={accentColor} />}
          label={phone ?? ''}
          onPress={() => { void Linking.openURL(`tel:${phone}`) }}
          accessibilityLabel={callAccessibilityLabel}
          testID={testID != null ? `${testID}-call` : undefined}
        />
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  row:  { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  name: { flex: 1, fontSize: 15, color: colors.text, lineHeight: 22 },
})
