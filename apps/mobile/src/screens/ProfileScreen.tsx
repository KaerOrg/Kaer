import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
  TouchableOpacity,
  Platform,
  Image,
  ActivityIndicator,
  Pressable,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import DateTimePicker from '@react-native-community/datetimepicker'
import { useAuthStore } from '../store/authStore'
import Button from '../components/Button'
import { colors, spacing, radius } from '../theme'
import {
  requestNotificationPermission,
  scheduleSleepDiaryReminder,
  cancelSleepDiaryReminder,
  getSleepDiaryReminderTime,
} from '../lib/notifications'
import { pickAvatarImage, uploadAvatar, saveAvatarUrl, type AvatarSource } from '../lib/avatar'

// ─── Avatar section ────────────────────────────────────────────────────────────

const AVATAR_SIZE = 84

interface AvatarSectionProps {
  uri: string | null
  uploading: boolean
  onPickSource: (source: AvatarSource) => void
}

function AvatarSection({ uri, uploading, onPickSource }: AvatarSectionProps) {
  const handlePress = useCallback(() => {
    Alert.alert('Changer la photo', 'Choisissez une source', [
      { text: 'Galerie photo', onPress: () => onPickSource('library') },
      { text: 'Appareil photo', onPress: () => onPickSource('camera') },
      { text: 'Annuler', style: 'cancel' },
    ])
  }, [onPickSource])

  return (
    <View style={avatarStyles.wrapper}>
      <Pressable onPress={handlePress} style={avatarStyles.container} accessibilityRole="button" accessibilityLabel="Modifier la photo de profil">
        {uri ? (
          <Image source={{ uri }} style={avatarStyles.image} />
        ) : (
          <View style={avatarStyles.placeholder}>
            <Text style={avatarStyles.placeholderText}>Photo</Text>
          </View>
        )}
        <View style={avatarStyles.badge}>
          <Text style={avatarStyles.badgeText}>✎</Text>
        </View>
      </Pressable>
      {uploading && (
        <ActivityIndicator
          size="small"
          color={colors.primary}
          style={avatarStyles.spinner}
        />
      )}
    </View>
  )
}

const avatarStyles = StyleSheet.create({
  wrapper: { alignItems: 'center', gap: spacing.xs },
  container: { width: AVATAR_SIZE, height: AVATAR_SIZE },
  image: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  placeholder: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: colors.primaryLight,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  badge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  badgeText: { color: colors.white, fontSize: 12 },
  spinner: { marginTop: spacing.xs },
})

// ─── Main screen ───────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const { patient, logout, updateAvatar } = useAuthStore()
  const [shareData, setShareData] = useState(false)
  const [notifEnabled, setNotifEnabled] = useState(false)
  const [notifTime, setNotifTime] = useState(new Date(new Date().setHours(8, 0, 0, 0)))
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)

  useEffect(() => {
    getSleepDiaryReminderTime().then((time) => {
      if (time) {
        setNotifEnabled(true)
        const d = new Date()
        d.setHours(time.hour, time.minute, 0, 0)
        setNotifTime(d)
      }
    })
  }, [])

  const handleToggleNotif = async (value: boolean) => {
    if (value) {
      const granted = await requestNotificationPermission()
      if (!granted) {
        Alert.alert(
          'Permission refusée',
          'Autorisez les notifications dans les paramètres de votre téléphone pour activer les rappels.'
        )
        return
      }
      await scheduleSleepDiaryReminder(notifTime.getHours(), notifTime.getMinutes())
    } else {
      await cancelSleepDiaryReminder()
    }
    setNotifEnabled(value)
  }

  const handleTimeChange = async (_: unknown, date?: Date) => {
    setShowTimePicker(Platform.OS === 'ios')
    if (date) {
      setNotifTime(date)
      if (notifEnabled) {
        await scheduleSleepDiaryReminder(date.getHours(), date.getMinutes())
      }
    }
  }

  const formatTime = (date: Date) =>
    `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`

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
      Alert.alert('Erreur', "Impossible de mettre à jour la photo. Réessayez.")
    } finally {
      setAvatarUploading(false)
    }
  }, [patient, updateAvatar])

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Êtes-vous sûr(e) de vouloir vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnecter', style: 'destructive', onPress: logout },
    ])
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>Mon profil</Text>

        {/* Avatar */}
        <AvatarSection
          uri={patient?.avatar_url ?? null}
          uploading={avatarUploading}
          onPickSource={handlePickSource}
        />

        {/* Compte */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mon compte</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Email</Text>
              <Text style={styles.rowValue} numberOfLines={1}>{patient?.email}</Text>
            </View>
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rappels</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.rowInfo}>
                <Text style={styles.rowLabel}>Rappel agenda du sommeil</Text>
                <Text style={styles.rowHint}>
                  Notification quotidienne pour noter votre nuit
                </Text>
              </View>
              <Switch
                value={notifEnabled}
                onValueChange={handleToggleNotif}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>

            {notifEnabled && (
              <>
                <View style={styles.separator} />
                <TouchableOpacity
                  style={styles.row}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Text style={styles.rowLabel}>Heure du rappel</Text>
                  <Text style={styles.timeValue}>{formatTime(notifTime)}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {showTimePicker && (
            <DateTimePicker
              value={notifTime}
              mode="time"
              is24Hour={true}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleTimeChange}
            />
          )}
        </View>

        {/* Confidentialité */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Confidentialité</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.rowInfo}>
                <Text style={styles.rowLabel}>Partager mes données</Text>
                <Text style={styles.rowHint}>
                  Autorise votre praticien à consulter vos saisies
                </Text>
              </View>
              <Switch
                value={shareData}
                onValueChange={setShareData}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>
          </View>
          <Text style={styles.disclaimer}>
            Par défaut, vos données restent uniquement sur votre téléphone. Vous choisissez librement ce que vous partagez avec votre praticien.
          </Text>
        </View>

        {/* Déconnexion */}
        <View style={styles.section}>
          <Button label="Se déconnecter" onPress={handleLogout} variant="danger" />
        </View>

        <Text style={styles.version}>PsyTool v1.0 · Données sécurisées sur votre appareil</Text>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl },
  heading: { fontSize: 28, fontWeight: '700', color: colors.text },
  section: { gap: spacing.sm },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  separator: { height: 1, backgroundColor: colors.border, marginHorizontal: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    minHeight: 56,
  },
  rowInfo: { flex: 1, marginRight: spacing.md },
  rowLabel: { fontSize: 16, fontWeight: '500', color: colors.text },
  rowValue: { fontSize: 14, color: colors.textMuted, maxWidth: 200 },
  rowHint: { fontSize: 13, color: colors.textMuted, marginTop: 2, lineHeight: 17 },
  timeValue: { fontSize: 18, fontWeight: '600', color: colors.primary },
  disclaimer: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  version: {
    fontSize: 12,
    color: colors.border,
    textAlign: 'center',
    marginTop: spacing.md,
  },
})
