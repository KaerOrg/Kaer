import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { computeAvailableSlots, jsDayToSchema } from '@services/appointmentService'
import type { AppointmentWithPatient } from '../../../lib/calendar.types'
import type { WeekGridProps } from './WeekGrid.types'
import './WeekGrid.css'

const GRID_START_HOUR = 7
const GRID_END_HOUR = 20
const HOUR_HEIGHT_PX = 64
const TOTAL_HEIGHT_PX = (GRID_END_HOUR - GRID_START_HOUR) * HOUR_HEIGHT_PX

const HOURS = Array.from(
  { length: GRID_END_HOUR - GRID_START_HOUR + 1 },
  (_, i) => GRID_START_HOUR + i,
)

function minutesToPx(minutes: number): number {
  return (minutes / 60) * HOUR_HEIGHT_PX
}

function isoToPx(iso: string): number {
  const d = new Date(iso)
  return minutesToPx(d.getHours() * 60 + d.getMinutes() - GRID_START_HOUR * 60)
}

function durationPx(startsAt: string, endsAt: string): number {
  const diff = new Date(endsAt).getTime() - new Date(startsAt).getTime()
  return minutesToPx(diff / 60000)
}

function toDateString(d: Date): string {
  const y = d.getFullYear()
  const m = (d.getMonth() + 1).toString().padStart(2, '0')
  const day = d.getDate().toString().padStart(2, '0')
  return `${y}-${m}-${day}`
}

function addDays(d: Date, n: number): Date {
  const copy = new Date(d)
  copy.setDate(copy.getDate() + n)
  return copy
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

function formatSlotTime(iso: string): string {
  const d = new Date(iso)
  const minutes = d.getMinutes()
  return minutes === 0
    ? `${d.getHours()}h`
    : `${d.getHours()}h${d.getMinutes().toString().padStart(2, '0')}`
}

function AppointmentBlock({
  appt,
  topPx,
  heightPx,
  onClick,
}: {
  appt: AppointmentWithPatient
  topPx: number
  heightPx: number
  onClick: () => void
}) {
  return (
    <button
      className={`week-grid__appt week-grid__appt--${appt.status}`}
      style={{ top: topPx, height: Math.max(heightPx, 20) }}
      onClick={onClick}
      title={appt.patient_display_name}
    >
      <div className="week-grid__appt-name">{appt.patient_display_name}</div>
      <div className="week-grid__appt-time">
        {formatTime(appt.starts_at)} – {formatTime(appt.ends_at)}
      </div>
    </button>
  )
}

export function WeekGrid({
  weekStart,
  rules,
  exceptions,
  appointments,
  onSlotClick,
  onAppointmentClick,
}: WeekGridProps) {
  const { t } = useTranslation()
  const today = toDateString(new Date())

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  )

  return (
    <div className="week-grid">
      {/* ── Header ── */}
      <div className="week-grid__header">
        <div className="week-grid__header-empty" />
        {days.map((day) => {
          const dateStr = toDateString(day)
          const isToday = dateStr === today
          const schemaDay = jsDayToSchema(day.getDay())
          return (
            <div
              key={dateStr}
              className={`week-grid__day-header ${isToday ? 'week-grid__day-header--today' : ''}`}
            >
              <div className="week-grid__day-label">
                {t(`agenda.days_short.${schemaDay}`)}
              </div>
              <div className="week-grid__day-number">{day.getDate()}</div>
            </div>
          )
        })}
      </div>

      {/* ── Body ── */}
      <div className="week-grid__body" style={{ height: TOTAL_HEIGHT_PX }}>
          {/* Time axis */}
          <div className="week-grid__time-axis" style={{ height: TOTAL_HEIGHT_PX }}>
            {HOURS.map(h => (
              <div
                key={h}
                className="week-grid__time-label"
                style={{ top: minutesToPx((h - GRID_START_HOUR) * 60) }}
              >
                {h}:00
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day) => {
            const dateStr = toDateString(day)
            const dayAppointments = appointments.filter(a =>
              a.starts_at.startsWith(dateStr),
            )
            const slots = computeAvailableSlots(rules, exceptions, dayAppointments, dateStr)

            return (
              <div
                key={dateStr}
                className="week-grid__day-col"
                style={{ height: TOTAL_HEIGHT_PX }}
              >
                {/* Hour dividers */}
                {HOURS.map(h => (
                  <div
                    key={h}
                    className="week-grid__hour-line"
                    style={{ top: minutesToPx((h - GRID_START_HOUR) * 60) }}
                  />
                ))}

                {/* Available slots */}
                {slots
                  .filter(s => s.is_available)
                  .map(s => {
                    const topPx = isoToPx(s.starts_at)
                    const heightPx = durationPx(s.starts_at, s.ends_at)
                    const rule = rules.find(r => r.day_of_week === jsDayToSchema(day.getDay()))
                    const slotDuration = rule?.slot_duration_minutes ?? 50
                    const showLabel = heightPx >= 28
                    return (
                      <div
                        key={s.starts_at}
                        className="week-grid__slot"
                        style={{ top: topPx, height: Math.max(heightPx - 2, 16) }}
                        onClick={() => onSlotClick(s.starts_at, s.ends_at, slotDuration)}
                        role="button"
                        tabIndex={0}
                        title={`${formatSlotTime(s.starts_at)} – ${formatSlotTime(s.ends_at)}`}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ' ')
                            onSlotClick(s.starts_at, s.ends_at, slotDuration)
                        }}
                      >
                        {showLabel && (
                          <span className="week-grid__slot-label">
                            {formatSlotTime(s.starts_at)}
                          </span>
                        )}
                      </div>
                    )
                  })}

                {/* Appointments */}
                {dayAppointments
                  .filter(a => a.status !== 'cancelled_by_patient' && a.status !== 'cancelled_by_practitioner')
                  .map(appt => {
                  const topPx = isoToPx(appt.starts_at)
                  const heightPx = durationPx(appt.starts_at, appt.ends_at)
                  return (
                    <AppointmentBlock
                      key={appt.id}
                      appt={appt}
                      topPx={topPx}
                      heightPx={heightPx}
                      onClick={() => onAppointmentClick(appt)}
                    />
                  )
                })}
              </div>
            )
          })}
        </div>
    </div>
  )
}
