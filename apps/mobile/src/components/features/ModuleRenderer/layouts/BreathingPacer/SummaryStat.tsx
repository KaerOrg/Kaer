import { memo } from 'react'
import { View, Text } from 'react-native'
import { summaryStyles } from './summaryStyles'

export interface SummaryStatProps {
  /** Valeur brute, déjà formatée par l'appelant (« 5:00 », « 30 », « 4 »). */
  value: string
  /** Ce que la valeur compte (« durée », « cycles », « de suite »). */
  label: string
  testID?: string
}

/**
 * Une tuile de la clôture : un chiffre brut et ce qu'il compte.
 *
 * Volontairement muette (MDR 2017/745) : elle affiche, elle ne qualifie pas. Aucune
 * couleur ne varie selon la valeur, aucun libellé ne la commente.
 */
export const SummaryStat = memo(function SummaryStat({ value, label, testID }: SummaryStatProps) {
  return (
    <View style={summaryStyles.stat} testID={testID}>
      <Text style={summaryStyles.statValue}>{value}</Text>
      <Text style={summaryStyles.statLabel}>{label}</Text>
    </View>
  )
})
