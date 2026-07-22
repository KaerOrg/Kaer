import React, { useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react-native'
import { useAuthStore } from '../store/authStore'
import { useConfirmDialog } from '../contexts/ConfirmDialogContext'
import { type Appointment } from '@services/appointmentService'
import { appointmentQueries, useCancelAppointment } from '../hooks/queries'
import { useRefreshOnFocus } from '../hooks/useRefreshOnFocus'
import { colors, spacing, radius, fontSize } from '@theme'
import type { AppStackParamList } from '../navigation/AppStack'
import { Button } from '@ui/Button'
import { EmptyState } from '@ui/EmptyState'

type Nav = NativeStackNavigationProp<AppStackParamList>

const EMPTY_APPTS: Appointment[] = []

const STATUS_COLORS: Record<string, string> = {
  pending: colors.warning,
  confirmed: colors.primary,
  cancelled_by_patient: colors.textMuted,
  cancelled_by_practitioner: colors.textMuted,
  completed: colors.success,
}

/** Horodatage du RDV dans la langue active de l'app (jamais une locale figée). */
function formatDateTime(iso: string, locale: string): string {
  const d = new Date(iso)
  return d.toLocaleString(locale, {
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
  upcoming,
  practitionerName,
  onCancel,
  onReschedule,
}: {
  appt: Appointment
  /** Rendez-vous encore à venir : seul cas où annuler ou reprogrammer a un sens. */
  upcoming: boolean
  /** Soignant qui suit le patient, `null` tant que la requête n'a pas répondu. */
  practitionerName: string | null
  onCancel: (id: string) => void
  onReschedule: (id: string) => void
}) {
  const { t, i18n } = useTranslation()
  const canAct = upcoming && (appt.status === 'pending' || appt.status === 'confirmed')
  const statusColor = STATUS_COLORS[appt.status] ?? colors.textMuted

  const handleCancel = useCallback(() => onCancel(appt.id), [onCancel, appt.id])
  const handleReschedule = useCallback(() => onReschedule(appt.id), [onReschedule, appt.id])

  return (
    <View style={styles.item}>
      <View style={[styles.statusBar, { backgroundColor: statusColor }]} />
      <View style={styles.itemContent}>
        <Text style={styles.itemTime}>{formatDateTime(appt.starts_at, i18n.language)}</Text>
        <View style={styles.itemMeta}>
          {practitionerName ? (
            <Text style={styles.itemPractitioner} numberOfLines={1}>{practitionerName}</Text>
          ) : null}
          <Text style={styles.itemStatus}>
            {t(`agenda.appointment.status_${
              appt.status
                .replace('cancelled_by_patient', 'cancelled')
                .replace('cancelled_by_practitioner', 'cancelled')
            }`)}
          </Text>
        </View>
        {canAct && (
          <View style={styles.itemActions}>
            <Button
              variant="secondary"
              size="sm"
              label={t('agenda.appointment.reschedule_btn')}
              onPress={handleReschedule}
            />
            <Button
              variant="danger"
              size="sm"
              label={t('agenda.appointment.cancel_btn')}
              onPress={handleCancel}
            />
          </View>
        )}
      </View>
    </View>
  )
}

export default function AppointmentsScreen() {
  const { t } = useTranslation()
  const navigation = useNavigation<Nav>()
  const { patient } = useAuthStore()
  const { showConfirm } = useConfirmDialog()

  const appointmentsQuery = useQuery(appointmentQueries.patientAppointments(patient?.id))
  const practitionerQuery = useQuery(appointmentQueries.patientPractitioner(patient?.id))
  const cancelMutation = useCancelAppointment(patient?.id)

  const appointments = appointmentsQuery.data ?? EMPTY_APPTS
  const practitionerId = practitionerQuery.data?.id ?? null
  const practitionerName = practitionerQuery.data?.name || null
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

  const handleBook = useCallback(() => {
    if (!practitionerId) return
    navigation.navigate('BookAppointment', { practitionerId })
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
                  <AppointmentItem key={appt.id} appt={appt} upcoming practitionerName={practitionerName} onCancel={handleCancel} onReschedule={handleReschedule} />
                ))}
              </>
            )}

            {past.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>{t('agenda.section_past')}</Text>
                {past.map(appt => (
                  <AppointmentItem key={appt.id} appt={appt} upcoming={false} practitionerName={practitionerName} onCancel={handleCancel} onReschedule={handleReschedule} />
                ))}
              </>
            )}
          </ScrollView>

          {practitionerId && (
            <View style={styles.bookBtnWrapper}>
              <Button
                label={t('agenda.appointment.new')}
                onPress={handleBook}
                iconLeft={<Plus size={18} color={colors.white} />}
              />
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
  // Pas de safe-area en bas : la barre d'onglets, sous cet écran, la porte déjà.
  bookBtnWrapper: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
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
  // Nom du soignant à gauche, statut à droite. Le nom se compresse (flexShrink)
  // pour que le statut reste lisible, jamais de débordement latéral.
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  itemPractitioner: {
    flexShrink: 1,
    fontSize: fontSize.caption,
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
})
