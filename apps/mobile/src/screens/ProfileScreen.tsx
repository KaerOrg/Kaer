import React, { useCallback, useMemo } from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, type CompositeNavigationProp } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import type { AppStackParamList, TabParamList } from '../navigation/AppStack'
import { useAuthStore } from '../store/authStore'
import { useConfirmDialog } from '../contexts/ConfirmDialogContext'
import { profileQueries } from '../hooks/queries'
import { useRefreshOnFocus } from '../hooks/useRefreshOnFocus'
import { trackingDays, formatSince } from '../lib/profileStats'
import { ProfileIdentityHeader } from '../components/features/ProfileIdentityHeader'
import { ProfileStatsCard, type ProfileStat } from '../components/features/ProfileStatsCard'
import { RegisterList, type RegisterItem } from '../components/features/RegisterList'
import { colors, spacing } from '@theme'

// Navigation composite : l'écran vit dans le Tab (accès aux onglets) imbriqué dans
// le Stack (accès à `Settings`, `WorkInProgress`). Évite tout cast.
type ProfileNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Profile'>,
  NativeStackNavigationProp<AppStackParamList>
>

const ICON_SIZE = 20

export default function ProfileScreen() {
  const navigation = useNavigation<ProfileNavigation>()
  const { t, i18n } = useTranslation()
  const locale = i18n.language
  const patient = useAuthStore((s) => s.patient)
  const logout = useAuthStore((s) => s.logout)
  const { showConfirm } = useConfirmDialog()

  const statsQuery = useQuery(profileQueries.stats(patient?.id))
  const { refetch } = statsQuery
  const refresh = useCallback(() => { refetch() }, [refetch])
  useRefreshOnFocus(refresh)

  const fullName = useMemo(
    () => `${patient?.first_name ?? ''} ${patient?.last_name ?? ''}`.trim(),
    [patient?.first_name, patient?.last_name],
  )

  const sinceLabel = useMemo(() => {
    const since = formatSince(statsQuery.data?.createdAt ?? null, locale)
    return since ? t('profile.since', { date: since }) : ''
  }, [statsQuery.data?.createdAt, locale, t])

  const stats = useMemo<ProfileStat[]>(() => {
    const data = statsQuery.data
    if (!data) return []
    return [
      { value: String(trackingDays(data.createdAt ?? '', new Date())), label: t('profile.stats.tracking_days') },
      { value: String(data.activeModules), label: t('profile.stats.active_modules') },
      { value: String(data.sessions), label: t('profile.stats.sessions') },
    ]
  }, [statsQuery.data, t])

  const goToSettings = useCallback(() => navigation.navigate('Settings'), [navigation])
  const goToWip = useCallback(
    (title: string) => navigation.navigate('WorkInProgress', { title }),
    [navigation],
  )

  const handleLogout = useCallback(() => {
    showConfirm({
      title: t('profile.logout_title'),
      message: t('profile.logout_message'),
      confirmLabel: t('profile.logout_confirm'),
      destructive: true,
      onConfirm: logout,
    })
  }, [showConfirm, logout, t])

  const trackingItems = useMemo<RegisterItem[]>(() => [
    {
      key: 'practitioner',
      label: t('profile.row_practitioner'),
      chipColor: colors.primary,
      icon: <MaterialCommunityIcons name="account-outline" size={ICON_SIZE} color={colors.white} />,
      onPress: () => goToWip(t('profile.row_practitioner')),
    },
    {
      key: 'documents',
      label: t('profile.row_documents'),
      chipColor: colors.primary,
      icon: <MaterialCommunityIcons name="file-document-outline" size={ICON_SIZE} color={colors.white} />,
      onPress: () => goToWip(t('profile.row_documents')),
    },
  ], [t, goToWip])

  const settingsItems = useMemo<RegisterItem[]>(() => [
    {
      key: 'notifications',
      label: t('profile.row_notifications'),
      chipColor: colors.primaryLight,
      icon: <MaterialCommunityIcons name="bell-outline" size={ICON_SIZE} color={colors.primary} />,
      onPress: () => goToWip(t('profile.row_notifications')),
    },
    {
      key: 'privacy',
      label: t('profile.row_privacy'),
      chipColor: colors.primaryLight,
      icon: <MaterialCommunityIcons name="lock-outline" size={ICON_SIZE} color={colors.primary} />,
      onPress: () => goToWip(t('profile.row_privacy')),
    },
    {
      key: 'logout',
      label: t('profile.logout_button'),
      chipColor: colors.dangerLight,
      labelColor: colors.dangerText,
      showChevron: false,
      icon: <MaterialCommunityIcons name="logout" size={ICON_SIZE} color={colors.danger} />,
      onPress: handleLogout,
    },
  ], [t, goToWip, handleLogout])

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <ProfileIdentityHeader
          name={fullName}
          sinceLabel={sinceLabel}
          onSettingsPress={goToSettings}
          settingsLabel={t('profile.settings_label')}
        />

        {stats.length > 0 ? <ProfileStatsCard stats={stats} /> : null}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('profile.section_my_tracking')}</Text>
          <RegisterList items={trackingItems} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('profile.section_settings')}</Text>
          <RegisterList items={settingsItems} />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.lg },
  section: { gap: spacing.sm },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginLeft: spacing.xs,
  },
})
