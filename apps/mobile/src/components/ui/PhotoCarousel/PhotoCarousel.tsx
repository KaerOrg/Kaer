// ─── PhotoCarousel : visionneuse photo plein écran (primitive design system) ──
//
// Modale plein écran affichant une liste de photos en diaporama : swipe horizontal
// paginé (FlatList native), flèches précédent/suivant (`@ui/Button`), bouton de
// fermeture et indicateur de page (n / total). Rendu via `expo-image`
// (`contentFit="contain"` : la photo n'est jamais rognée).
//
// Primitive générique, zéro métier : reçoit les URIs et les libellés
// d'accessibilité par props. Animations : opacité (fondu de la modale) et
// translation (pagination native de la FlatList) uniquement.

import { useCallback, useEffect, useRef, useState } from 'react'
import { Modal, View, Text, FlatList, StyleSheet, useWindowDimensions, type ListRenderItemInfo, type NativeSyntheticEvent, type NativeScrollEvent } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { colors, spacing } from '@theme'
import { Button } from '@ui/Button'

export interface PhotoCarouselProps {
  visible: boolean
  /** URIs des photos à afficher plein écran. */
  uris: ReadonlyArray<string>
  /** Index affiché à l'ouverture (défaut : 0). */
  initialIndex?: number
  onClose: () => void
  /** Libellés d'accessibilité (i18n, fournis par le parent : un primitive n'a pas de texte en dur). */
  closeLabel: string
  prevLabel: string
  nextLabel: string
  testID?: string
}

export function PhotoCarousel({ visible, uris, initialIndex = 0, onClose, closeLabel, prevLabel, nextLabel, testID }: PhotoCarouselProps) {
  const { width, height } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const listRef = useRef<FlatList<string>>(null)
  const [index, setIndex] = useState(initialIndex)

  // Réaligner l'index courant sur l'index d'ouverture à chaque réouverture.
  useEffect(() => {
    if (visible) setIndex(initialIndex)
  }, [visible, initialIndex])

  const getItemLayout = useCallback(
    (_: ArrayLike<string> | null | undefined, i: number) => ({ length: width, offset: width * i, index: i }),
    [width],
  )

  const onMomentumEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(e.nativeEvent.contentOffset.x / width))
  }, [width])

  const goTo = useCallback((next: number) => {
    const clamped = Math.max(0, Math.min(next, uris.length - 1))
    listRef.current?.scrollToIndex({ index: clamped, animated: true })
    setIndex(clamped)
  }, [uris.length])

  const renderItem = useCallback(({ item, index: i }: ListRenderItemInfo<string>) => (
    <View style={{ width, height }}>
      <Image
        source={{ uri: item }}
        style={styles.photo}
        contentFit="contain"
        testID={testID != null ? `${testID}-photo-${i}` : undefined}
      />
    </View>
  ), [width, height, testID])

  if (uris.length === 0) return null

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} testID={testID}>
      <View style={styles.backdrop}>
        <FlatList
          ref={listRef}
          data={uris as string[]}
          keyExtractor={(uri, i) => `${i}-${uri}`}
          renderItem={renderItem}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          getItemLayout={getItemLayout}
          initialScrollIndex={initialIndex}
          onMomentumScrollEnd={onMomentumEnd}
        />

        <View style={[styles.topBar, { top: insets.top + spacing.sm }]}>
          <Button
            variant="ghost"
            iconLeft={<MaterialCommunityIcons name="close" size={26} color={colors.white} />}
            onPress={onClose}
            accessibilityLabel={closeLabel}
            testID={testID != null ? `${testID}-close` : undefined}
          />
        </View>

        {uris.length > 1 ? (
          <View style={[styles.bottomBar, { bottom: insets.bottom + spacing.lg }]}>
            <Button
              variant="ghost"
              iconLeft={<MaterialCommunityIcons name="chevron-left" size={30} color={colors.white} />}
              onPress={() => goTo(index - 1)}
              disabled={index === 0}
              accessibilityLabel={prevLabel}
              testID={testID != null ? `${testID}-prev` : undefined}
            />
            <Text style={styles.counter}>{`${index + 1} / ${uris.length}`}</Text>
            <Button
              variant="ghost"
              iconLeft={<MaterialCommunityIcons name="chevron-right" size={30} color={colors.white} />}
              onPress={() => goTo(index + 1)}
              disabled={index === uris.length - 1}
              accessibilityLabel={nextLabel}
              testID={testID != null ? `${testID}-next` : undefined}
            />
          </View>
        ) : null}
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlayStrong },
  photo:    { flex: 1 },
  topBar:   { position: 'absolute', right: spacing.sm },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  counter: { color: colors.white, fontSize: 15, fontWeight: '600', minWidth: 56, textAlign: 'center' },
})
