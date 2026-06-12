import React, { useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Plus, ChevronRight } from 'lucide-react-native'
import { useAuthStore } from '../store/authStore'
import { useConfirmDialog } from '../contexts/ConfirmDialogContext'
import { type Appointment } from '../services/appointmentService'
import { appointmentQueries, useCancelAppointment } from '../hooks/queries'
import { useRefreshOnFocus } from '../hooks/useRefreshOnFocus'
import { colors, spacing, radius, fontSize } from '../theme'
import type { AppStackParamList } from '../navigation/AppStack'
import { EmptyState } from '../components/ui/EmptyState'

type Nav = NativeStackNavigationProp<AppStackParamList>

const EMPTY_APPTS: Appointment[] = []

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
  onReschedule,
}: {
  appt: Appointment
  onCancel: (id: string) => void
  onReschedule: (id: string) => void
}) {
  const { t } = useTranslation()
  const canAct = appt.status === 'pending' || appt.status === 'confirmed'
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
        {canAct && (
          <View style={styles.itemActions}>
            <Pressable
              style={styles.rescheduleBtn}
              onPress={() => onReschedule(appt.id)}
            >
              <Text style={styles.rescheduleBtnText}>
                {t('agenda.appointment.reschedule_btn')}
              </Text>
            </Pressable>
            <Pressable
              style={styles.cancelBtn}
              onPress={() => onCancel(appt.id)}
            >
              <Text style={styles.cancelBtnText}>
                {t('agenda.appointment.cancel_btn')}
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  )
}

export default function AppointmentsScreen() {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const navigation = useNavigation<Nav>()
  const { patient } = useAuthStore()
  const { showConfirm } = useConfirmDialog()

  const appointmentsQuery = useQuery(appointmentQueries.patientAppointments(patient?.id))
  const practitionerQuery = useQuery(appointmentQueries.patientPractitioner(patient?.id))
  const cancelMutation = useCancelAppointment(patient?.id)

  const appointments = appointmentsQuery.data ?? EMPTY_APPTS
  const practitionerId = practitionerQuery.data?.id ?? null
  const loading = appointmentsQuery.isLoading || practitionerQuery.isLoading

  const refetch = useCallback(() => {
    appointmentsQuery.refetch()
    practitionerQuery.refetch()
  }, [appointmentsQuery, practitionerQuery])
  useRefreshOnFocus(refetch)

  const handleCancel = useCallback((id: string) => {
    showConfirm({
      title: t('agenda.appointment.cancel_btn'),
      message: t('agenda.appointment.cancel_confirm'),
      confirmLabel: t('common.delete'),
      destructive: true,
      onConfirm: () => cancelMutation.mutate(id),
    })
  }, [t, cancelMutation, showConfirm])

  const handleReschedule = useCallback((id: string) => {
    if (!practitionerId) return
    navigation.navigate('BookAppointment', { practitionerId, appointmentId: id })
  }, [navigation, practitionerId])

  const upcoming = appointments.filter(isUpcoming)
  const past = appointments.filter(a => !isUpcoming(a))

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.scroll}>
            {upcoming.length === 0 && past.length === 0 ? (
              <View style={styles.emptyWrapper}>
                <EmptyState
                  icon="📅"
                  title={t('agenda.empty_title')}
                  description={t('agenda.empty_description')}
                />
              </View>
            ) : null}

            {upcoming.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>{t('agenda.section_upcoming')}</Text>
                {upcoming.map(appt => (
                  <AppointmentItem key={appt.id} appt={appt} onCancel={handleCancel} onReschedule={handleReschedule} />
                ))}
              </>
            )}

            {past.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>{t('agenda.section_past')}</Text>
                {past.map(appt => (
                  <AppointmentItem key={appt.id} appt={appt} onCancel={handleCancel} onReschedule={handleReschedule} />
                ))}
              </>
            )}
          </ScrollView>

          {practitionerId && (
            <View style={[styles.bookBtnWrapper, { paddingBottom: insets.bottom + spacing.md }]}>
              <Pressable
                style={styles.bookBtn}
                onPress={() =>
                  navigation.navigate('BookAppointment', { practitionerId })
                }
              >
                <Plus size={18} color="#fff" />
                <Text style={styles.bookBtnText}>{t('agenda.appointment.new')}</Text>
              </Pressable>
            </View>
          )}
        </>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { flexGrow: 1, padding: spacing.md, gap: spacing.sm },
  emptyWrapper: { flex: 1, justifyContent: 'center' },
  bookBtnWrapper: {
    padding: spacing.md,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
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
    padding: spacing.md,
    gap: 6,
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
  itemActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  rescheduleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  rescheduleBtnText: {
    fontSize: 13,
    color: colors.primary,
  },
  cancelBtn: {
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
