// ─── ChronoLegend — légende figée des repères chronobiologiques ─────────────
//
// Rangée de 6 pastilles (couleur + icône d'ancre) + libellé court, affichée une
// seule fois au-dessus de la liste du Journal (frise 24 h). Couleurs et icônes
// viennent de la SOURCE UNIQUE `CHRONO_ANCHORS` (@kaer/shared) — aucune en dur.
// Présentationnel, conforme MDR 2017/745 (repères descriptifs, aucun jugement).

import { memo } from 'react'
import { View, Text } from 'react-native'
import { CHRONO_ANCHORS } from '@kaer/shared'
import { colors } from '@theme'
import { resolveChronoIcon } from '../ChronoMonth/chronoIcons'
import { styles } from './styles'

interface Props {
  t: (key: string) => string
}

export const ChronoLegend = memo(function ChronoLegend({ t }: Props) {
  return (
    <View style={styles.legendBar} testID="chrono-legend">
      {CHRONO_ANCHORS.map(anchor => {
        const Icon = resolveChronoIcon(anchor.iconName)
        return (
          <View key={anchor.key} style={styles.legendItem}>
            <View style={[styles.legendPill, { backgroundColor: anchor.color }]}>
              <Icon size={10} color={colors.white} />
            </View>
            <Text style={styles.legendLabel}>{t(anchor.labelCode)}</Text>
          </View>
        )
      })}
    </View>
  )
})
