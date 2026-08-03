import { memo, useMemo } from 'react'
import { Modal, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { spacing } from '@theme'
import { styles } from './Sheet.styles'
import type { SheetProps } from './Sheet.types'

/** Part de la hauteur d'écran au-delà de laquelle le contenu défile (mode `scrollable`). */
const MAX_HEIGHT_RATIO = 0.7

/**
 * Feuille de bas d'écran à contenu libre : voile sombre, poignée, titre optionnel,
 * puis le contenu fourni par l'appelant.
 *
 * Toute feuille de bas d'écran passe par ce primitive, jamais un `Modal transparent`
 * + backdrop + coins arrondis réassemblés dans un layout. À distinguer de
 * `ui/ActionSheet` (contrat figé « liste d'options », piloté par un provider) : ici
 * le contenu est arbitraire (réglages, formulaire court).
 *
 * L'appelant fournit `closeLabel` déjà traduit : un primitive ne connaît aucune clé
 * i18n de domaine.
 */
export const Sheet = memo(function Sheet({
  visible, onClose, title, subtitle, closeLabel, children, scrollable = false, testID,
}: SheetProps) {
  const insets = useSafeAreaInsets()
  const { height } = useWindowDimensions()

  const sheetStyle = useMemo(
    () => [styles.sheet, { paddingBottom: insets.bottom + spacing.md }],
    [insets.bottom],
  )
  const scrollStyle = useMemo(
    () => ({ maxHeight: height * MAX_HEIGHT_RATIO }),
    [height],
  )

  const header = (title || subtitle) ? (
    <View style={styles.header}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  ) : null

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <Pressable
          style={styles.backdropTap}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={closeLabel}
          testID={testID ? `${testID}-backdrop` : undefined}
        />
        <View style={sheetStyle} testID={testID}>
          <View style={styles.handle} />
          {header}
          {scrollable ? (
            <ScrollView style={scrollStyle} contentContainerStyle={styles.body}>
              {children}
            </ScrollView>
          ) : (
            <View style={styles.body}>{children}</View>
          )}
        </View>
      </View>
    </Modal>
  )
})

export default Sheet
