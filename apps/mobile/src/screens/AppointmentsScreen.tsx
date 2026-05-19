import React, { useCallback, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useTranslation } from 'react-i18next'
import { Plus, ChevronRight } from 'lucide-react-native'
import { useAuthStore } from '../store/authStore'
import {
  fetchPatientAppointments,
  cancelAppointment,
  fetchPatientPractitioner,
  type Appointment,
} from '../services/appointmentService'
import { colors, spacing, radius, fontSize } from '../theme'
import type { AppStackParamList } from '../navigation/AppStack'
import { EmptyState } from '../components/ui/EmptyState'

type Nav = NativeStackNavigationProp<AppStackParamList>

const STATUS_COLORS: Record<string, string> = {
  pending: colors.warning,
  confirmed: colors.primary,
  cancelled_by_patient: colors.textMuted,
  cancelled_by_practitioner: colors.textMuted,
  completed: colors.success,
}

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('fr-FR', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  })
}

function isUpcoming(appt: Appointment): boolean {
  return (
    new Date(appt.starts_at) >= new Date() &&
    appt.status !== 'cancelled_by_patient' &&
    appt.status !== 'cancelled_by_practitioner'
  )
}

function AppointmentItem({
  appt,
  onCancel,
}: {
  appt: Appointment
  onCancel: (id: string) => void
}) {
  const { t } = useTranslation()
  const canCancel =
    appt.status === 'pending' || appt.status === 'confirmed'
  const statusColor = STATUS_COLORS[appt.status] ?? colors.textMuted

  return (
    <View style={styles.item}>
      <View style={[styles.statusBar, { backgroundColor: statusColor }]} />
      <View style={styles.itemContent}>
        <Text style={styles.itemTime}>{formatDateTime(appt.starts_at)}</Text>
        <Text style={styles.itemStatus}>
          {t(`agenda.appointment.status_${
            appt.status
              .replace('cancelled_by_patient', 'cancelled')
              .replace('cancelled_by_practitioner', 'cancelled')
          }`)}
        </Text>
        {canCancel && (
          <Pressable
            style={styles.cancelBtn}
            onPress={() => onCancel(appt.id)}
          >
            <Text style={styles.cancelBtnText}>
              {t('agenda.appointment.cancel_btn')}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  )
}

export default function AppointmentsScreen() {
  const { t } = useTranslation()
  const navigation = useNavigation<Nav>()
  const { patient } = useAuthStore()

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [practitionerId, setPractitionerId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!patient) return
    setLoading(true)
    const [appts, pract] = await Promise.all([
      fetchPatientAppointments(patient.id),
      fetchPatientPractitioner(patient.id),
    ])
    setAppointments(appts)
    setPractitionerId(pract?.id ?? null)
    setLoading(false)
  }, [patient])

  useFocusEffect(useCallback(() => { load().catch(() => setLoading(false)) }, [load]))

  const handleCancel = useCallback((id: string) => {
    Alert.alert(
      t('agenda.appointment.cancel_btn'),
      t('agenda.appointment.cancel_confirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            await cancelAppointment(id)
            void load()
          },
        },
      ],
    )
  }, [t, load])

  const upcoming = appointments.filter(isUpcoming)
  const past = appointments.filter(a => !isUpcoming(a))

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {practitionerId && (
            <Pressable
              style={styles.bookBtn}
              onPress={() =>
                navigation.navigate('BookAppointment', { practitionerId })
              }
            >
              <Plus size={18} color="#fff" />
              <Text style={styles.bookBtnText}>{t('agenda.appointment.new')}</Text>
            </Pressable>
          )}

          {upcoming.length === 0 && past.length === 0 ? (
            <EmptyState
              icon="📅"
              title={t('agenda.empty_title')}
              description={t('agenda.empty_description')}
            />
          ) : null}

          {upcoming.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>{t('agenda.section_upcoming')}</Text>
              {upcoming.map(appt => (
                <AppointmentItem key={appt.id} appt={appt} onCancel={handleCancel} />
              ))}
            </>
          )}

          {past.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>{t('agenda.section_past')}</Text>
              {past.map(appt => (
                <AppointmentItem key={appt.id} appt={appt} onCancel={handleCancel} />
              ))}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: spacing.md, gap: spacing.sm },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  bookBtnText: {
    color: '#fff',
    fontSize: fontSize.body,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: fontSize.caption,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: spacing.sm,
    marginBottom: 4,
  },
  item: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    overflow: 'hidden',
    marginBottom: 8,
  },
  statusBar: {
    width: 4,
  },
  itemContent: {
    flex: 1,
    padding: spacing.sm,
    gap: 4,
  },
  itemTime: {
    fontSize: fontSize.body,
    fontWeight: '600',
    color: colors.text,
  },
  itemStatus: {
    fontSize: fontSize.caption,
    color: colors.textMuted,
  },
  cancelBtn: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  cancelBtnText: {
    fontSize: 13,
    color: colors.danger,
  },
})
