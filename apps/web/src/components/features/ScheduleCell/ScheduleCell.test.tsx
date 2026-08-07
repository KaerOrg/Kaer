import { vi, describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts ? `${key} ${Object.values(opts).join(' ')}` : key,
    i18n: { language: 'fr' },
  }),
}))

import { ScheduleCell } from './ScheduleCell'
import type { ScheduleStatus } from '../../../lib/scaleScheduleStatus'

describe('ScheduleCell', () => {
  it('non programmée : libellé + bouton Programmer, clic sans propagation', () => {
    const onProgram = vi.fn()
    const { container } = render(<ScheduleCell status={{ kind: 'unscheduled' }} onProgram={onProgram} />)
    expect(screen.getByText('scales.programmed.unscheduled')).toBeInTheDocument()
    const btn = screen.getByRole('button', { name: 'scales.programmed.program_btn' })
    fireEvent.click(btn)
    expect(onProgram).toHaveBeenCalledTimes(1)
    expect(container.querySelector('.schedule-cell--unscheduled')).not.toBeNull()
  })

  it('hétéro à la demande : « en séance », aucune date', () => {
    const status: ScheduleStatus = { kind: 'on_demand', mode: 'in_session' }
    render(<ScheduleCell status={status} onProgram={vi.fn()} />)
    expect(screen.getByText('scales.programmed.in_session')).toBeInTheDocument()
  })

  it('auto à la demande : « à domicile · à la demande »', () => {
    const status: ScheduleStatus = { kind: 'on_demand', mode: 'home' }
    render(<ScheduleCell status={status} onProgram={vi.fn()} />)
    expect(screen.getByText('scales.programmed.home_on_demand')).toBeInTheDocument()
  })

  it('auto à venir : cadence + date + cloche de rappel', () => {
    const status: ScheduleStatus = { kind: 'home', frequency: 'biweekly', nextDate: '2026-07-26', overdueDays: 0, reminder: true }
    const { container } = render(<ScheduleCell status={status} onProgram={vi.fn()} />)
    // cloche de rappel présente
    expect(container.querySelector('.schedule-cell__bell')).not.toBeNull()
    // pas de pastille ambre en état à venir
    expect(container.querySelector('.schedule-cell--overdue')).toBeNull()
  })

  it('auto à venir sans rappel : pas de cloche', () => {
    const status: ScheduleStatus = { kind: 'home', frequency: 'monthly', nextDate: '2026-08-17', overdueDays: 0, reminder: false }
    const { container } = render(<ScheduleCell status={status} onProgram={vi.fn()} />)
    expect(container.querySelector('.schedule-cell__bell')).toBeNull()
  })

  it('en retard : pastille ambre + nombre de jours, jamais rouge', () => {
    const status: ScheduleStatus = { kind: 'home', frequency: 'monthly', nextDate: '2026-07-02', overdueDays: 20, reminder: true }
    const { container } = render(<ScheduleCell status={status} onProgram={vi.fn()} />)
    expect(container.querySelector('.schedule-cell--overdue')).not.toBeNull()
    expect(screen.getByText(/20/)).toBeInTheDocument()
    // la cloche n'apparaît pas dans la pastille « en retard »
    expect(container.querySelector('.schedule-cell__bell')).toBeNull()
  })
})
