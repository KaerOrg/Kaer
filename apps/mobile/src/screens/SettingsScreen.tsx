import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  TextInput,
  Share,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../store/authStore'
import { useToast } from '../contexts/ToastContext'
import { useConfirmDialog } from '../contexts/ConfirmDialogContext'
import { useActionSheet } from '../contexts/ActionSheetContext'
import Button from '@ui/Button'
import { colors, spacing, radius } from '@theme'
import { SUPPORTED } from '../i18n'
import { NotificationRoutinePanel } from '../components/features/NotificationRoutinePanel'
import { AvatarEditor } from '../components/features/AvatarEditor'
import { pickAvatarImage, uploadAvatar, saveAvatarUrl, type AvatarSource } from '@services/avatarService'
import { exportMyData, eraseMyAccount } from '@services/patientDataRightsService'

const LANGUAGE_LABELS: Record<string, string> = {
  fr: 'Français',
  en: 'English',
  es: 'Español',
  de: 'Deutsch',
  it: 'Italiano',
  pt: 'Português',
}

/**
 * Écran « Réglages » du patient (ouvert depuis la roue crantée du Profil). Regroupe
 * l'identité éditable, l'avatar, la langue, les rappels, la confidentialité et les
 * droits RGPD (export / effacement) — fonctions légalement obligatoires et donc
 * toujours accessibles depuis ici tant que leurs écrans dédiés ne sont pas conçus.
 */
export default function SettingsScreen() {
  const { t } = useTranslation()
  const { patient, updateAvatar, updateProfile, language, setLanguage, shareConsent, setShareConsent } = useAuthStore()
  const { showToast } = useToast()
  const { showConfirm } = useConfirmDialog()
  const { showActionSheet } = useActionSheet()

  const [firstName, setFirstName] = useState(patient?.first_name ?? '')
  const [lastName, setLastName] = useState(patient?.last_name ?? '')
  const [phone, setPhone] = useState(patient?.phone ?? '')
  const [savingProfile, setSavingProfile] = useState(false)

  const [avatarUploading, setAvatarUploading] = useState(false)
  const [exportingData, setExportingData] = useState(false)

  const handleExportData = useCallback(async () => {
    if (!patient) return
    setExportingData(true)
    const result = await exportMyData(patient.id)
    setExportingData(false)
    if (!result.ok) {
      showToast(t('profile.data_rights.export_error'), 'error')
      return
    }
    await Share.share({ message: JSON.stringify(result.data, null, 2) })
  }, [patient, showToast, t])

  const handleEraseAccount = useCallback(() => {
    showConfirm({
      title: t('profile.data_rights.erase_title'),
      message: t('profile.data_rights.erase_message'),
      confirmLabel: t('profile.data_rights.erase_confirm'),
      destructive: true,
      onConfirm: async () => {
        if (!patient) return
        const result = await eraseMyAccount(patient.id)
        // Succès → eraseMyAccount a déjà purgé le local et fermé la session
        // (onAuthChange route vers l'écran de connexion). On ne signale que l'échec.
        if (!result.ok) showToast(t('profile.data_rights.erase_error'), 'error')
      },
    })
  }, [patient, showConfirm, showToast, t])

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
  }, [patient, updateAvatar, showToast, t])

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
  }, [firstName, lastName, phone, updateProfile, showToast, t])

  const handleLanguageChange = useCallback(() => {
    showActionSheet({
      title: t('profile.language_label'),
      options: SUPPORTED.map((lng) => ({
        label: LANGUAGE_LABELS[lng] ?? lng,
        onPress: () => setLanguage(lng),
      })),
    })
  }, [showActionSheet, t, setLanguage])

  const profileDirty =
    firstName !== (patient?.first_name ?? '') ||
    lastName !== (patient?.last_name ?? '') ||
    phone !== (patient?.phone ?? '')

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <AvatarEditor
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
          {profileDirty ? (
            <Button
              label={t('profile.save_profile_button')}
              onPress={handleSaveProfile}
              loading={savingProfile}
            />
          ) : null}
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
          {patient?.id != null ? <NotificationRoutinePanel patientId={patient.id} /> : null}
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
          <Text style={styles.sectionTitle}>{t('profile.data_rights.section')}</Text>
          <Text style={styles.disclaimer}>{t('profile.data_rights.hint')}</Text>
          <Button
            label={t('profile.data_rights.export_button')}
            onPress={handleExportData}
            loading={exportingData}
            variant="secondary"
          />
          <Button
            label={t('profile.data_rights.erase_button')}
            onPress={handleEraseAccount}
            variant="danger"
          />
        </View>

        <Text style={styles.version}>{t('profile.version')}</Text>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl },
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
