import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Pressable,
  TextInput,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../store/authStore'
import { useToast } from '../contexts/ToastContext'
import { useConfirmDialog } from '../contexts/ConfirmDialogContext'
import { useActionSheet } from '../contexts/ActionSheetContext'
import Button from '../components/ui/Button'
import { colors, spacing, radius } from '../theme'
import { SUPPORTED } from '../i18n'
import { NotificationRoutinePanel } from '../components/features/NotificationRoutinePanel'
import { pickAvatarImage, uploadAvatar, saveAvatarUrl, type AvatarSource } from '../services/avatarService'

const AVATAR_SIZE = 84

const LANGUAGE_LABELS: Record<string, string> = {
  fr: 'Français',
  en: 'English',
  es: 'Español',
  de: 'Deutsch',
  it: 'Italiano',
  pt: 'Português',
}

interface AvatarSectionProps {
  uri: string | null
  uploading: boolean
  onPickSource: (source: AvatarSource) => void
}

function AvatarSection({ uri, uploading, onPickSource }: AvatarSectionProps) {
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
    <View style={avatarStyles.wrapper}>
      <Pressable
        onPress={handlePress}
        style={avatarStyles.container}
        accessibilityRole="button"
        accessibilityLabel={t('profile.avatar_edit_label')}
      >
        {uri ? (
          <Image source={{ uri }} style={avatarStyles.image} />
        ) : (
          <View style={avatarStyles.placeholder}>
            <Text style={avatarStyles.placeholderText}>{t('profile.avatar_placeholder')}</Text>
          </View>
        )}
        <View style={avatarStyles.badge}>
          <Text style={avatarStyles.badgeText}>✎</Text>
        </View>
      </Pressable>
      {uploading && (
        <ActivityIndicator size="small" color={colors.primary} style={avatarStyles.spinner} />
      )}
    </View>
  )
}

const avatarStyles = StyleSheet.create({
  wrapper: { alignItems: 'center', gap: spacing.xs },
  container: { width: AVATAR_SIZE, height: AVATAR_SIZE },
  image: { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2, borderWidth: 2, borderColor: colors.primary },
  placeholder: { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2, backgroundColor: colors.primaryLight, borderWidth: 2, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  placeholderText: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  badge: { position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.white },
  badgeText: { color: colors.white, fontSize: 12 },
  spinner: { marginTop: spacing.xs },
})

export default function ProfileScreen() {
  const { t } = useTranslation()
  const { patient, logout, updateAvatar, updateProfile, language, setLanguage, shareConsent, setShareConsent } = useAuthStore()
  const { showToast } = useToast()
  const { showConfirm } = useConfirmDialog()
  const { showActionSheet } = useActionSheet()

  const [firstName, setFirstName] = useState(patient?.first_name ?? '')
  const [lastName, setLastName] = useState(patient?.last_name ?? '')
  const [phone, setPhone] = useState(patient?.phone ?? '')
  const [savingProfile, setSavingProfile] = useState(false)

  const [avatarUploading, setAvatarUploading] = useState(false)

  const handleToggleConsent = useCallback(async (value: boolean) => {
    const ok = await setShareConsent(value)
    if (!ok) showToast(t('profile.share_data_error'), 'error')
  }, [setShareConsent, showToast, t])

  const handlePickSource = useCallback(async (source: AvatarSource) => {
    if (!patient) return
    const uri = await pickAvatarImage(source)
    if (!uri) return
    setAvatarUploading(true)
    try {
      const publicUrl = await uploadAvatar(patient.id, uri)
      await saveAvatarUrl(patient.id, publicUrl)
      updateAvatar(publicUrl)
    } catch {
      showToast(t('profile.avatar_error'), 'error')
    } finally {
      setAvatarUploading(false)
    }
  }, [patient, updateAvatar, t])

  const handleSaveProfile = useCallback(async () => {
    setSavingProfile(true)
    const result = await updateProfile({
      first_name: firstName,
      last_name: lastName,
      phone: phone || null,
    })
    setSavingProfile(false)
    if (result.ok) {
      showToast(t('profile.save_profile_success'), 'success')
    } else {
      showToast(t('profile.save_profile_error'), 'error')
    }
  }, [firstName, lastName, phone, updateProfile, t])

  const handleLogout = () => {
    showConfirm({
      title: t('profile.logout_title'),
      message: t('profile.logout_message'),
      confirmLabel: t('profile.logout_confirm'),
      destructive: true,
      onConfirm: logout,
    })
  }

  const handleLanguageChange = () => {
    showActionSheet({
      title: t('profile.language_label'),
      options: SUPPORTED.map((lng) => ({
        label: LANGUAGE_LABELS[lng] ?? lng,
        onPress: () => setLanguage(lng),
      })),
    })
  }

  const profileDirty =
    firstName !== (patient?.first_name ?? '') ||
    lastName !== (patient?.last_name ?? '') ||
    phone !== (patient?.phone ?? '')

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>{t('profile.title')}</Text>

        <AvatarSection
          uri={patient?.avatar_url ?? null}
          uploading={avatarUploading}
          onPickSource={handlePickSource}
        />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.section_identity')}</Text>
          <View style={styles.card}>
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>{t('profile.first_name_label')}</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder={t('profile.first_name_placeholder')}
                placeholderTextColor={colors.textMuted}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>
            <View style={styles.separator} />
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>{t('profile.last_name_label')}</Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder={t('profile.last_name_placeholder')}
                placeholderTextColor={colors.textMuted}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>
            <View style={styles.separator} />
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>{t('profile.phone_label')}</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder={t('profile.phone_placeholder')}
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                returnKeyType="done"
              />
            </View>
          </View>
          {profileDirty && (
            <Button
              label={t('profile.save_profile_button')}
              onPress={handleSaveProfile}
              loading={savingProfile}
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.section_account')}</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>{t('profile.email_label')}</Text>
              <Text style={styles.rowValue} numberOfLines={1}>{patient?.email}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.section_language')}</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.row} onPress={handleLanguageChange}>
              <Text style={styles.rowLabel}>{t('profile.language_label')}</Text>
              <Text style={styles.timeValue}>{LANGUAGE_LABELS[language] ?? language}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.section_reminders')}</Text>
          {patient?.id != null && (
            <NotificationRoutinePanel patientId={patient.id} />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.section_privacy')}</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.rowInfo}>
                <Text style={styles.rowLabel}>{t('profile.share_data_label')}</Text>
                <Text style={styles.rowHint}>{t('profile.share_data_hint')}</Text>
              </View>
              <Switch
                value={shareConsent}
                onValueChange={handleToggleConsent}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>
          </View>
          <Text style={styles.disclaimer}>{t('profile.privacy_disclaimer')}</Text>
        </View>

        <View style={styles.section}>
          <Button label={t('profile.logout_button')} onPress={handleLogout} variant="danger" />
        </View>

        <Text style={styles.version}>{t('profile.version')}</Text>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl },
  heading: { fontSize: 28, fontWeight: '700', color: colors.text },
  section: { gap: spacing.sm },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  separator: { height: 1, backgroundColor: colors.border, marginHorizontal: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, minHeight: 56 },
  rowInfo: { flex: 1, marginRight: spacing.md },
  rowLabel: { fontSize: 16, fontWeight: '500', color: colors.text },
  rowValue: { fontSize: 14, color: colors.textMuted, maxWidth: 200 },
  rowHint: { fontSize: 13, color: colors.textMuted, marginTop: 2, lineHeight: 17 },
  timeValue: { fontSize: 18, fontWeight: '600', color: colors.primary },
  disclaimer: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  version: { fontSize: 12, color: colors.border, textAlign: 'center', marginTop: spacing.md },
  inputRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, minHeight: 56 },
  inputLabel: { fontSize: 16, fontWeight: '500', color: colors.text, flex: 1 },
  input: { flex: 2, fontSize: 15, color: colors.text, textAlign: 'right', paddingVertical: spacing.sm },
})
