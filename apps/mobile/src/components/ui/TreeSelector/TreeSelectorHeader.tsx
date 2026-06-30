import { View, Text, Pressable } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { colors } from '@theme'
import { styles } from './styles'

interface TreeSelectorHeaderProps {
  onBack: () => void
  showProgress: boolean
  accentColor: string
  breadcrumb: string
  /** Progression 0→1 (largeur de la barre). */
  progress: number
  /** Libellé d'accessibilité du bouton retour (déjà traduit). */
  backLabel: string
}

/** En-tête des modes de saisie : flèche retour + barre de progression teintée. */
export function TreeSelectorHeader({ onBack, showProgress, accentColor, breadcrumb, progress, backLabel }: TreeSelectorHeaderProps) {
  return (
    <View style={styles.header}>
      <Pressable
        onPress={onBack}
        style={styles.backBtn}
        accessibilityRole="button"
        accessibilityLabel={backLabel}
        testID="back-button"
      >
        <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
      </Pressable>
      {showProgress ? (
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: accentColor }]} />
          </View>
          {breadcrumb ? (
            <Text style={styles.progressLabel} numberOfLines={1}>{breadcrumb}</Text>
          ) : null}
        </View>
      ) : null}
    </View>
  )
}
