import React, { useCallback, useMemo, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react-native'
import { mondayOf, weekDays, todayIso } from '@kaer/shared'
import { useAuthStore } from '../store/authStore'
import { useConfirmDialog } from '../contexts/ConfirmDialogContext'
import { useActionSheet } from '../contexts/ActionSheetContext'
import { type Appointment, type AppointmentStatus } from '@services/appointmentService'
import { appointmentQueries, useCancelAppointment } from '../hooks/queries'
import { useRefreshOnFocus } from '../hooks/useRefreshOnFocus'
import { useTeen } from '../hooks/useTeen'
import { buildAgendaData } from '../lib/agendaData'
import { dayAbbrev, dayNumber, formatTime, formatLongDate } from '../lib/agendaFormat'
import { colors, spacing, fonts } from '@theme'
import type { AppStackParamList } from '../navigation/AppStack'
import { BrandHeader } from '../components/features/BrandHeader'
import { WeekStrip, type WeekDay } from '../components/features/WeekStrip'
import { NextAppointmentCard } from '../components/features/NextAppointmentCard'
import { AppointmentRegister, type AppointmentRegisterItem } from '../components/features/AppointmentRegister'
import { EmptyState } from '@ui/EmptyState'
import type { StatusBadgeVariant } from '@ui/StatusBadge'

type Nav = NativeStackNavigationProp<AppStackParamList>

const EMPTY_APPTS: Appointment[] = []

// Statut réel du RDV → variante de badge du design system. Aucune interprétation
// clinique : simple correspondance d'état administratif (MDR 2017/745).
const STATUS_VARIANT: Record<AppointmentStatus, StatusBadgeVariant> = {
  pending: 'warning',
  confirmed: 'info',
  cancelled_by_patient: 'neutral',
  cancelled_by_practitioner: 'neutral',
  completed: 'success',
}

/** Un RDV encore à venir et non annulé peut être reprogrammé ou annulé. */
function isActionable(status: AppointmentStatus): boolean {
  return status === 'pending' || status === 'confirmed'
}

// Un `Date` local à midi évite tout décalage de jour lors du formatage d'une date ISO
// (YYYY-MM-DD) selon le fuseau (minuit UTC vs minuit local).
function isoAtNoon(iso: string): string {
  return `${iso}T12:00:00`
}

export default function AppointmentsScreen() {
  const { isTeenMode } = useTeen()
  const { t, i18n } = useTranslation(isTeenMode ? ['teen', 'common'] : 'common')
  const locale = i18n.language
  const navigation = useNavigation<Nav>()
  const { patient } = useAuthStore()
  const { showConfirm } = useConfirmDialog()
  const { showActionSheet } = useActionSheet()

  const [selectedDay, setSelectedDay] = useState<string>(() => todayIso())

  const appointmentsQuery = useQuery(appointmentQueries.patientAppointments(patient?.id))
  const practitionerQuery = useQuery(appointmentQueries.patientPractitioner(patient?.id))
  const cancelMutation = useCancelAppointment(patient?.id)

  const appointments = appointmentsQuery.data ?? EMPTY_APPTS
  const practitionerId = practitionerQuery.data?.id ?? null
  const practitionerName = practitionerQuery.data?.name || null
  const practitionerTitle = practitionerQuery.data?.professional_title ?? null
  const loading = appointmentsQuery.isLoading || practitionerQuery.isLoading

  // Dépendre des `refetch` (stables, liés à l'observer TanStack Query) et non des
  // objets query, recréés à chaque rendu.
  const { refetch: refetchAppointments } = appointmentsQuery
  const { refetch: refetchPractitioner } = practitionerQuery
  const refetch = useCallback(() => {
    refetchAppointments()
    refetchPractitioner()
  }, [refetchAppointments, refetchPractitioner])
  useRefreshOnFocus(refetch)

  const agenda = useMemo(() => buildAgendaData(appointments, new Date()), [appointments])

  // Libellé du titre d'une ligne : le praticien qui suit le patient. Repli générique si
  // son nom n'est pas encore chargé.
  const rowTitle = practitionerName ?? t('agenda.appointment.default_title')

  const statusLabel = useCallback((status: AppointmentStatus): string => {
    const key = status
      .replace('cancelled_by_patient', 'cancelled')
      .replace('cancelled_by_practitioner', 'cancelled')
    return t(`agenda.appointment.status_${key}`)
  }, [t])

  const weekCells = useMemo<WeekDay[]>(() => {
    const eventSet = new Set(agenda.eventDays)
    return weekDays(mondayOf(todayIso())).map((iso) => ({
      iso,
      weekday: dayAbbrev(isoAtNoon(iso), locale),
      dayNumber: dayNumber(isoAtNoon(iso)),
      selected: iso === selectedDay,
      hasEvent: eventSet.has(iso),
    }))
  }, [agenda.eventDays, selectedDay, locale])

  // `allowActions` : seuls les RDV à venir sont reprogrammables/annulables. Les passés
  // sont en lecture seule, quel que soit leur statut.
  const toRegisterItem = useCallback((appt: Appointment, allowActions: boolean): AppointmentRegisterItem => ({
    id: appt.id,
    weekday: dayAbbrev(appt.starts_at, locale),
    dayNumber: dayNumber(appt.starts_at),
    title: rowTitle,
    detail: `${formatTime(appt.starts_at, locale)} · ${statusLabel(appt.status)}`,
    tappable: allowActions && isActionable(appt.status),
  }), [locale, rowTitle, statusLabel])

  const upcomingItems = useMemo(() => agenda.upcoming.map((a) => toRegisterItem(a, true)), [agenda.upcoming, toRegisterItem])
  const pastItems = useMemo(() => agenda.past.map((a) => toRegisterItem(a, false)), [agenda.past, toRegisterItem])

  const handleBook = useCallback(() => {
    if (!practitionerId) return
    navigation.navigate('BookAppointment', { practitionerId })
  }, [navigation, practitionerId])

  const confirmCancel = useCallback((id: string) => {
    showConfirm({
      title: t('agenda.appointment.cancel_btn'),
      message: t('agenda.appointment.cancel_confirm'),
      confirmLabel: t('common.delete'),
      destructive: true,
      onConfirm: () => cancelMutation.mutate(id),
    })
  }, [t, cancelMutation, showConfirm])

  // Tap sur un RDV actionnable → feuille d'actions (reprogrammer / annuler), équivalent
  // mobile de la modale RDV web.
  const handleSelectAppointment = useCallback((id: string) => {
    if (!practitionerId) return
    showActionSheet({
      title: t('agenda.appointment.manage_title'),
      options: [
        {
          label: t('agenda.appointment.reschedule_btn'),
          onPress: () => navigation.navigate('BookAppointment', { practitionerId, appointmentId: id }),
        },
        {
          label: t('agenda.appointment.cancel_short'),
          destructive: true,
          onPress: () => confirmCancel(id),
        },
      ],
    })
  }, [practitionerId, showActionSheet, t, navigation, confirmCancel])

  const handleNextPress = useCallback(() => {
    if (agenda.next && isActionable(agenda.next.status)) handleSelectAppointment(agenda.next.id)
  }, [agenda.next, handleSelectAppointment])

  const bookAction = practitionerId
    ? {
        icon: <Plus size={20} color={colors.primary} />,
        onPress: handleBook,
        accessibilityLabel: t('agenda.appointment.new'),
      }
    : undefined

  const isEmpty = !agenda.next && upcomingItems.length === 0 && pastItems.length === 0
  const next = agenda.next

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.container}>
          <BrandHeader rightAction={bookAction} />
          <Text style={styles.heading}>{t('agenda.title')}</Text>

          <WeekStrip days={weekCells} onSelectDay={setSelectedDay} />

          {isEmpty ? (
            <EmptyState
              icon="📅"
              title={t('agenda.empty_title')}
              description={t('agenda.empty_description')}
            />
          ) : null}

          {next ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{t('agenda.section_next')}</Text>
              <NextAppointmentCard
                name={rowTitle}
                role={practitionerTitle}
                statusLabel={statusLabel(next.status)}
                statusVariant={STATUS_VARIANT[next.status]}
                dateLabel={formatLongDate(next.starts_at, locale)}
                timeLabel={formatTime(next.starts_at, locale)}
                onPress={isActionable(next.status) ? handleNextPress : undefined}
                accessibilityLabel={t('agenda.section_next')}
              />
            </View>
          ) : null}

          {upcomingItems.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{t('agenda.section_upcoming')}</Text>
              <AppointmentRegister items={upcomingItems} onSelect={handleSelectAppointment} />
            </View>
          ) : null}

          {pastItems.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{t('agenda.section_past')}</Text>
              <AppointmentRegister items={pastItems} onSelect={handleSelectAppointment} />
            </View>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: spacing.lg, gap: spacing.lg },
  heading: { fontSize: 40, fontWeight: '700', color: colors.text, fontFamily: fonts.serif },
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
