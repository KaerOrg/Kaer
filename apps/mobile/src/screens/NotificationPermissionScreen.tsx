import React, { useCallback, useState } from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import {
  Bell,
  CalendarClock,
  Calendar,
  SlidersHorizontal,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react-native'
import { useAuthStore } from '../store/authStore'
import {
  requestNotificationPermission,
  registerPushToken,
  markNotificationOnboardingSeen,
} from '@services/notificationService'
import Button from '@ui/Button'
import { colors, spacing, radius, fontSize } from '@theme'

interface NotificationPermissionScreenProps {
  onDone: () => void
}

interface BenefitRowProps {
  icon: LucideIcon
  title: string
  text: string
}

const BenefitRow = React.memo(function BenefitRow({ icon: Icon, title, text }: BenefitRowProps) {
  return (
    <View style={styles.benefitRow}>
      <View style={styles.benefitIcon}>
        <Icon size={22} color={colors.primary} />
      </View>
      <View style={styles.benefitTexts}>
        <Text style={styles.benefitTitle}>{title}</Text>
        <Text style={styles.benefitText}>{text}</Text>
      </View>
    </View>
  )
})

export default function NotificationPermissionScreen({ onDone }: NotificationPermissionScreenProps) {
  const { t } = useTranslation()
  const patient = useAuthStore((s) => s.patient)
  const [loading, setLoading] = useState(false)

  const handleEnable = useCallback(async () => {
    setLoading(true)
    try {
      const granted = await requestNotificationPermission()
      if (granted && patient) {
        await registerPushToken(patient.id)
      }
    } finally {
      await markNotificationOnboardingSeen()
      setLoading(false)
      onDone()
    }
  }, [patient, onDone])

  const handleSkip = useCallback(async () => {
    await markNotificationOnboardingSeen()
    onDone()
  }, [onDone])

  return (
    <SafeAreaView style={styles.safe} edges={EDGES}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Bell size={36} color={colors.primary} />
          </View>
          <Text style={styles.title}>{t('notifications.onboarding.title')}</Text>
          <Text style={styles.intro}>{t('notifications.onboarding.intro')}</Text>
        </View>

        <View style={styles.benefits}>
          <BenefitRow
            icon={CalendarClock}
            title={t('notifications.onboarding.benefit_exercises_title')}
            text={t('notifications.onboarding.benefit_exercises_text')}
          />
          <BenefitRow
            icon={Calendar}
            title={t('notifications.onboarding.benefit_appointments_title')}
            text={t('notifications.onboarding.benefit_appointments_text')}
          />
          <BenefitRow
            icon={SlidersHorizontal}
            title={t('notifications.onboarding.benefit_control_title')}
            text={t('notifications.onboarding.benefit_control_text')}
          />
        </View>

        <View style={styles.privacyNote}>
          <ShieldCheck size={18} color={colors.textMuted} />
          <Text style={styles.privacyText}>{t('notifications.onboarding.privacy_note')}</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={t('notifications.onboarding.enable_button')}
          onPress={handleEnable}
          loading={loading}
        />
        <Button
          label={t('notifications.onboarding.skip_button')}
          onPress={handleSkip}
          variant="ghost"
          disabled={loading}
        />
        <Text style={styles.skipHint}>{t('notifications.onboarding.skip_hint')}</Text>
      </View>
    </SafeAreaView>
  )
}

const EDGES = ['top', 'bottom'] as const

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, padding: spacing.lg, gap: spacing.xl },
  hero: { alignItems: 'center', gap: spacing.sm },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: fontSize.h1,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  intro: {
    fontSize: fontSize.body,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  benefits: { gap: spacing.lg },
  benefitRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  benefitIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitTexts: { flex: 1, gap: 2 },
  benefitTitle: { fontSize: fontSize.h3, fontWeight: '600', color: colors.text },
  benefitText: { fontSize: fontSize.caption, color: colors.textMuted, lineHeight: 20 },
  privacyNote: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.neutral,
  },
  privacyText: { flex: 1, fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  footer: {
    padding: spacing.lg,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  skipHint: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
})
