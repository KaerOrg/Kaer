import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { BreathingReminderPanel } from './BreathingReminderPanel'
import type { BreathingReminder } from '@services/engagementService'

const fetchBreathingReminder = vi.fn()
vi.mock('@services/engagementService', () => ({
  fetchBreathingReminder: (...a: unknown[]) => fetchBreathingReminder(...a),
}))

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

const reminder = (over: Partial<BreathingReminder> = {}): BreathingReminder => ({
  enabled: true, time: '21:00', days: [1, 3, 5], updatedAt: '2026-08-05T10:00:00Z', ...over,
})

function renderPanel() {
  render(<BreathingReminderPanel patientId="p-1" locale="fr" />, { wrapper })
}

describe('BreathingReminderPanel : W3', () => {
  it('explique que le rappel appartient au patient', async () => {
    fetchBreathingReminder.mockResolvedValue(reminder())
    renderPanel()
    expect(await screen.findByText(/créé et réglé par le patient/)).toBeTruthy()
  })

  it('affiche le rappel réglé par le patient, heure et jours', async () => {
    fetchBreathingReminder.mockResolvedValue(reminder())
    renderPanel()
    const detail = await screen.findByTestId('breathing-reminder-detail')
    expect(detail.textContent).toContain('21:00')
    // Ordre d'affichage de la semaine, pas l'ordre stocké.
    expect(detail.textContent).toContain('lun · mer · ven')
  })

  it('annonce l’absence de rappel', async () => {
    fetchBreathingReminder.mockResolvedValue(null)
    renderPanel()
    expect(await screen.findByTestId('breathing-reminder-none')).toBeTruthy()
  })

  it('ne présente pas comme actif un rappel sans heure ni jour', async () => {
    fetchBreathingReminder.mockResolvedValue(reminder({ time: null, days: [] }))
    renderPanel()
    expect(await screen.findByTestId('breathing-reminder-none')).toBeTruthy()
  })

  it('n’offre aucun contrôle d’édition au praticien', async () => {
    fetchBreathingReminder.mockResolvedValue(reminder())
    renderPanel()
    await screen.findByTestId('breathing-reminder-detail')
    expect(screen.queryAllByRole('button')).toHaveLength(0)
    expect(screen.queryAllByRole('textbox')).toHaveLength(0)
    expect(screen.queryAllByRole('combobox')).toHaveLength(0)
    expect(screen.queryAllByRole('switch')).toHaveLength(0)
  })
})
