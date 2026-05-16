import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight } from 'lucide-react-native'
import { useAuthStore } from '../store/authStore'
import {
  fetchPractitionerRules,
  fetchPractitionerExceptions,
  fetchBookedSlots,
  bookAppointment,
  computeAvailableSlots,
  type AvailabilityRule,
  type AvailabilityException,
  type ComputedSlot,
} from '../services/appointmentService'
import { colors, spacing, radius, fontSize } from '../theme'
import type { AppStackParamList } from '../navigation/AppStack'

type Route = RouteProp<AppStackParamList, 'BookAppointment'>

const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MONTH_LABELS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function addDays(d: Date, n: number): Date {
  const copy = new Date(d)
  copy.setDate(copy.getDate() + n)
  return copy
}

function addMonths(d: Date, n: number): Date {
  const copy = new Date(d)
  copy.setMonth(copy.getMonth() + n)
  copy.setDate(1)
  return copy
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number): number {
  const jsDay = new Date(year, month, 1).getDay()
  return jsDay === 0 ? 6 : jsDay - 1
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

export default function BookAppointmentScreen() {
  const { t } = useTranslation()
  const navigation = useNavigation()
  const route = useRoute<Route>()
  const { practitionerId } = route.params
  const { patient } = useAuthStore()

  const today = useMemo(() => new Date(), [])
  const [calendarDate, setCalendarDate] = useState<Date>(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [slots, setSlots] = useState<ComputedSlot[]>([])
  const [rules, setRules] = useState<AvailabilityRule[]>([])
  const [exceptions, setExceptions] = useState<AvailabilityException[]>([])
  const [loading, setLoading] = useState(true)
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [booking, setBooking] = useState(false)
  const [success, setSuccess] = useState(false)

  const year = calendarDate.getFullYear()
  const month = calendarDate.getMonth()
  const daysInMonth = getDaysInMonth(year, month)
  const firstDayOffset = getFirstDayOfMonth(year, month)

  useEffect(() => {
    setLoading(true)
    const from = toDateString(new Date(year, month, 1))
    const to = toDateString(new Date(year, month, daysInMonth))
    Promise.all([
      fetchPractitionerRules(practitionerId),
      fetchPractitionerExceptions(practitionerId, from, to),
    ]).then(([r, exc]) => {
      setRules(r)
      setExceptions(exc)
      setLoading(false)
    })
  }, [practitionerId, year, month, daysInMonth])

  const loadSlots = useCallback(async (date: string) => {
    setSlotsLoading(true)
    const booked = await fetchBookedSlots(practitionerId, date)
    const computed = computeAvailableSlots(rules, exceptions, booked, date)
    setSlots(computed.filter(s => s.is_available))
    setSlotsLoading(false)
  }, [practitionerId, rules, exceptions])

  const handleDateSelect = useCallback((date: string) => {
    setSelectedDate(date)
    setSuccess(false)
    void loadSlots(date)
  }, [loadSlots])

  const handleBook = useCallback(async (slot: ComputedSlot) => {
    if (!patient) return
    setBooking(true)
    const result = await bookAppointment({
      practitioner_id: practitionerId,
      patient_id: patient.id,
      starts_at: slot.starts_at,
      ends_at: slot.ends_at,
    })
    setBooking(false)
    if (result.ok) {
      setSuccess(true)
      void loadSlots(selectedDate!)
    }
  }, [patient, practitionerId, selectedDate, loadSlots])

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = Array(firstDayOffset).fill(null)
    for (let i = 1; i <= daysInMonth; i++) days.push(i)
    return days
  }, [firstDayOffset, daysInMonth])

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Month navigation */}
        <View style={styles.monthNav}>
          <Pressable onPress={() => setCalendarDate(d => addMonths(d, -1))} style={styles.navBtn}>
            <ChevronLeft size={20} color={colors.primary} />
          </Pressable>
          <Text style={styles.monthLabel}>{MONTH_LABELS[month]} {year}</Text>
          <Pressable onPress={() => setCalendarDate(d => addMonths(d, 1))} style={styles.navBtn}>
            <ChevronRight size={20} color={colors.primary} />
          </Pressable>
        </View>

        {/* Day-of-week header */}
        <View style={styles.calendarHeader}>
          {DAY_LABELS.map(l => (
            <Text key={l} style={styles.dayLabel}>{l}</Text>
          ))}
        </View>

        {/* Calendar grid */}
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: 32 }} />
        ) : (
          <View style={styles.calendarGrid}>
            {calendarDays.map((day, idx) => {
              if (day === null) return <View key={`empty-${idx}`} style={styles.dayCell} />
              const dateStr = toDateString(new Date(year, month, day))
              const isPast = dateStr < toDateString(today)
              const isSelected = dateStr === selectedDate
              const hasSlots = computeAvailableSlots(rules, exceptions, [], dateStr).length > 0

              return (
                <Pressable
                  key={dateStr}
                  style={[
                    styles.dayCell,
                    isSelected && styles.dayCellSelected,
                    !hasSlots && styles.dayCellNoSlots,
                  ]}
                  disabled={isPast || !hasSlots}
                  onPress={() => handleDateSelect(dateStr)}
                >
                  <Text style={[
                    styles.dayText,
                    isSelected && styles.dayTextSelected,
                    (isPast || !hasSlots) && styles.dayTextMuted,
                  ]}>
                    {day}
                  </Text>
                  {hasSlots && !isSelected && <View style={styles.slotDot} />}
                </Pressable>
              )
            })}
          </View>
        )}

        {/* Slots */}
        {selectedDate && (
          <View style={styles.slotsSection}>
            <Text style={styles.slotsSectionTitle}>
              {new Date(selectedDate + 'T12:00:00').toLocaleDateString('fr-FR', {
                weekday: 'long', day: 'numeric', month: 'long',
              })}
            </Text>

            {slotsLoading ? (
              <ActivityIndicator color={colors.primary} />
            ) : slots.length === 0 ? (
              <Text style={styles.noSlots}>{t('agenda.empty_week')}</Text>
            ) : (
              <View style={styles.slotsList}>
                {slots.map(slot => (
                  <Pressable
                    key={slot.starts_at}
                    style={styles.slotItem}
                    onPress={() => handleBook(slot)}
                    disabled={booking}
                  >
                    <Text style={styles.slotTime}>
                      {formatTime(slot.starts_at)} – {formatTime(slot.ends_at)}
                    </Text>
                    <ChevronRight size={16} color={colors.primary} />
                  </Pressable>
                ))}
              </View>
            )}

            {success && (
              <View style={styles.successBanner}>
                <Text style={styles.successText}>{t('agenda.book_success')}</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.md },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  navBtn: { padding: spacing.sm },
  monthLabel: { fontSize: fontSize.h3, fontWeight: '700', color: colors.text },
  calendarHeader: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  dayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dayCellSelected: {
    backgroundColor: colors.primary,
    borderRadius: 99,
  },
  dayCellNoSlots: {
    opacity: 0.3,
  },
  dayText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },
  dayTextSelected: { color: '#fff', fontWeight: '700' },
  dayTextMuted: { color: colors.textMuted },
  slotDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  slotsSection: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  slotsSectionTitle: {
    fontSize: fontSize.h3,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  noSlots: { fontSize: fontSize.caption, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.md },
  slotsList: { gap: 8 },
  slotItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  slotTime: { fontSize: fontSize.body, fontWeight: '600', color: colors.text },
  successBanner: {
    backgroundColor: colors.successLight,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  successText: { fontSize: fontSize.body, color: colors.success, fontWeight: '600' },
})
