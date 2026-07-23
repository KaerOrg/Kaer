import React, { useCallback } from 'react'
import { View, Text, StyleSheet, Image, ActivityIndicator, Pressable } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useActionSheet } from '../../../contexts/ActionSheetContext'
import { colors, spacing } from '@theme'
import type { AvatarSource } from '@services/avatarService'

const AVATAR_SIZE = 84

interface AvatarEditorProps {
  /** URL de la photo actuelle, ou null pour afficher le placeholder d'initiales. */
  uri: string | null
  uploading: boolean
  onPickSource: (source: AvatarSource) => void
}

/**
 * Éditeur d'avatar : photo ronde tappable ouvrant une feuille d'actions
 * (galerie / appareil photo) + badge crayon. SURFACE d'édition (le `Pressable`
 * enrobe la photo entière), pas un bouton d'action — cas de surface toléré.
 */
export const AvatarEditor = React.memo(function AvatarEditor({ uri, uploading, onPickSource }: AvatarEditorProps) {
  const { t } = useTranslation()
  const { showActionSheet } = useActionSheet()

  const handlePress = useCallback(() => {
    showActionSheet({
      title: t('profile.avatar_change_title'),
      options: [
        { label: t('profile.avatar_gallery'), onPress: () => onPickSource('library') },
        { label: t('profile.avatar_camera'), onPress: () => onPickSource('camera') },
      ],
    })
  }, [onPickSource, t, showActionSheet])

  return (
    <View style={styles.wrapper}>
      <Pressable
        onPress={handlePress}
        style={styles.container}
        accessibilityRole="button"
        accessibilityLabel={t('profile.avatar_edit_label')}
      >
        {uri ? (
          <Image source={{ uri }} style={styles.image} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>{t('profile.avatar_placeholder')}</Text>
          </View>
        )}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>✎</Text>
        </View>
      </Pressable>
      {uploading ? <ActivityIndicator size="small" color={colors.primary} style={styles.spinner} /> : null}
    </View>
  )
})

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', gap: spacing.xs },
  container: { width: AVATAR_SIZE, height: AVATAR_SIZE },
  image: { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2, borderWidth: 2, borderColor: colors.primary },
  placeholder: {
    width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2,
    backgroundColor: colors.primaryLight, borderWidth: 2, borderColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  placeholderText: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  badge: {
    position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.white,
  },
  badgeText: { color: colors.white, fontSize: 12 },
  spinner: { marginTop: spacing.xs },
})
