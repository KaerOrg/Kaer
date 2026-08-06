import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { BreathingDataPanel } from './BreathingDataPanel'
import type { BreathingSessionRow } from '@kaer/shared'

vi.mock('@services/moduleService', () => ({
  fetchModuleFields: vi.fn().mockResolvedValue({
    preview_kind: 'breathing_pacer',
    fields: [
      {
        field_type: 'breathing_technique', sort_order: 100,
        props: { technique_key: 'coherence_cardiaque', color: '#4A9EA3', recommended_duration_min: '5' },
        children: [{ field_type: 'breathing_phase', sort_order: 1, props: { phase_type: 'inhale', phase_seconds: '5' }, children: [] }],
      },
      {
        field_type: 'breathing_technique', sort_order: 110,
        props: { technique_key: 'carree', color: '#D97706', recommended_duration_min: '4' },
        children: [{ field_type: 'breathing_phase', sort_order: 1, props: { phase_type: 'inhale', phase_seconds: '4' }, children: [] }],
      },
    ],
  }),
}))

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

/** Aujourd'hui, pour que les sessions tombent dans la fenêtre « 30 jours ». */
function isoToday(hour = 8, offsetDays = 0): string {
  const d = new Date()
  d.setDate(d.getDate() - offsetDays)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(hour)}:00:00`
}

const session = (over: Partial<BreathingSessionRow> = {}): BreathingSessionRow => ({
  startedAt: isoToday(),
  techniqueKey: 'coherence_cardiaque',
  durationSeconds: 300,
  plannedDurationSeconds: 300,
  cyclesCompleted: 30,
  completed: true,
  feeling: null,
  ...over,
})

function renderPanel(sessions: BreathingSessionRow[]) {
  render(<BreathingDataPanel sessions={sessions} patientRef="ref-1" locale="fr" />, { wrapper })
}

describe('BreathingDataPanel : W1', () => {
  it('compte les sessions de la période', async () => {
    renderPanel([session(), session({ startedAt: isoToday(20) })])
    expect((await screen.findByTestId('breathing-tile-sessions')).textContent).toBe('2')
  })

  it('distingue les sessions menées au bout du total', async () => {
    renderPanel([session({ completed: true }), session({ startedAt: isoToday(20), completed: false })])
    expect((await screen.findByTestId('breathing-tile-completed')).textContent).toBe('1 / 2')
  })

  it('fait apparaître une session interrompue dans le journal, marquée', async () => {
    renderPanel([session({ completed: false })])
    expect(await screen.findByText('interrompue')).toBeTruthy()
  })

  it('compte les ressentis en effectifs bruts, et les sessions sans réponse', async () => {
    renderPanel([
      session({ feeling: 'calmer' }),
      session({ startedAt: isoToday(9), feeling: 'tenser' }),
      session({ startedAt: isoToday(10), feeling: null }),
    ])
    const row = await screen.findByTestId('breathing-feeling-coherence_cardiaque')
    expect(row.textContent).toContain('1 sans ressenti')
  })

  it('affiche la note « comptes bruts » exigée', async () => {
    renderPanel([session()])
    expect(await screen.findByText(/sans pondération ni score/)).toBeTruthy()
  })

  it('n’affiche aucun jugement de ressenti (MDR)', async () => {
    renderPanel([session({ feeling: 'calmer' })])
    await screen.findByTestId('breathing-tile-sessions')
    // « score » n'est pas cherché : la note de conformité dit justement
    // « sans pondération ni score », et la chasser interdirait de la lire.
    expect(screen.queryByText(/efficac|meilleure|tendance|corr[ée]lation|moyenne du ressenti/i)).toBeNull()
  })

  it('range les sessions par moment de la journée', async () => {
    renderPanel([session({ startedAt: isoToday(8) }), session({ startedAt: isoToday(21) })])
    expect((await screen.findByTestId('breathing-moment-morning')).textContent).toContain('1')
    expect(screen.getByTestId('breathing-moment-evening').textContent).toContain('1')
  })

  it('pagine le journal par cinq', async () => {
    const many = Array.from({ length: 7 }, (_, i) => session({ startedAt: isoToday(8 + i) }))
    renderPanel(many)
    await screen.findByTestId('breathing-tile-sessions')
    expect(screen.getAllByTestId('breathing-journal-row')).toHaveLength(5)
    fireEvent.click(screen.getByText('Suivant'))
    expect(screen.getAllByTestId('breathing-journal-row')).toHaveLength(2)
  })

  it('filtre par technique, tuiles comprises', async () => {
    renderPanel([session(), session({ startedAt: isoToday(9), techniqueKey: 'carree' })])
    // Par le rôle, pas par le texte : le nom de la technique apparaît AUSSI dans la
    // ligne de journal, et la puce est le seul bouton à le porter.
    const chip = await screen.findByRole('button', { name: 'Respiration carrée' })
    expect(screen.getByTestId('breathing-tile-sessions').textContent).toBe('2')
    fireEvent.click(chip)
    expect(screen.getByTestId('breathing-tile-sessions').textContent).toBe('1')
  })

  it('écarte les sessions hors période', async () => {
    renderPanel([session(), session({ startedAt: isoToday(8, 200) })])
    expect((await screen.findByTestId('breathing-tile-sessions')).textContent).toBe('1')
    fireEvent.click(screen.getByText('Tout'))
    expect(screen.getByTestId('breathing-tile-sessions').textContent).toBe('2')
  })

  it('propose un export CSV', async () => {
    renderPanel([session()])
    expect(await screen.findByTestId('breathing-export')).toBeTruthy()
  })

  it('annonce un journal vide sans session sur la période', async () => {
    renderPanel([session({ startedAt: isoToday(8, 200) })])
    expect(await screen.findByText(/Aucune session sur la période/)).toBeTruthy()
  })
})
