import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { BreathingPatientView } from './BreathingPatientView'

const technique = (key: string, color: string, seconds: number[]) => ({
  field_type: 'breathing_technique', sort_order: 100,
  props: { technique_key: key, color, recommended_duration_min: '5' },
  children: seconds.map((phase_seconds, index) => ({
    field_type: 'breathing_phase', sort_order: index,
    props: { phase_type: index % 2 === 0 ? 'inhale' : 'exhale', phase_seconds: String(phase_seconds) },
    children: [],
  })),
})

const FIELDS = [
  technique('coherence_cardiaque', '#4A9EA3', [5, 5]),
  technique('carree', '#C8956F', [4, 4]),
]

const { mockConfig } = vi.hoisted(() => ({ mockConfig: vi.fn() }))

vi.mock('@services/moduleService', () => ({
  fetchModuleFields: () => Promise.resolve({ preview_kind: 'breathing_pacer', fields: FIELDS }),
}))
vi.mock('@services/moduleAssignmentService', () => ({
  fetchBreathingPractitionerConfig: (...args: unknown[]) => mockConfig(...args),
  fetchDefusionTechniques: () => Promise.resolve([]),
}))

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

beforeEach(() => {
  vi.clearAllMocks()
  mockConfig.mockResolvedValue({
    enabledTechniques: ['coherence_cardiaque', 'carree'],
    primaryTechnique: 'coherence_cardiaque',
    weeklyGoalSessions: 4,
  })
})

describe('BreathingPatientView : W5', () => {
  it('rend les quatre ecrans du parcours', async () => {
    render(<BreathingPatientView patientModuleId="pm1" />, { wrapper })
    await screen.findByText('1 · Accueil')
    expect(screen.getByText('2 · Préparation')).toBeTruthy()
    expect(screen.getByText('3 · Séance')).toBeTruthy()
    expect(screen.getByText('4 · Clôture')).toBeTruthy()
  })

  it('reflete la configuration du patient, pas des valeurs par defaut', async () => {
    mockConfig.mockResolvedValue({
      enabledTechniques: ['carree'], primaryTechnique: 'carree', weeklyGoalSessions: 6,
    })
    render(<BreathingPatientView patientModuleId="pm1" />, { wrapper })
    await waitFor(() => expect(screen.getByText('2 sur 6 cette semaine')).toBeTruthy())
    expect(screen.getAllByText('Respiration carrée').length).toBeGreaterThan(0)
    expect(screen.queryByText('Cohérence cardiaque')).toBeNull()
  })

  it('met la technique principale en avant, avec son rythme', async () => {
    render(<BreathingPatientView patientModuleId="pm1" />, { wrapper })
    await waitFor(() => expect(screen.getAllByText('Cohérence cardiaque').length).toBeGreaterThan(0))
    expect(screen.getAllByText('5s · 5s').length).toBeGreaterThan(0)
  })

  it('dit qu aucun objectif n est fixe plutot que d en inventer un', async () => {
    mockConfig.mockResolvedValue({
      enabledTechniques: ['coherence_cardiaque'], primaryTechnique: null, weeklyGoalSessions: null,
    })
    render(<BreathingPatientView patientModuleId="pm1" />, { wrapper })
    await waitFor(() => expect(screen.getByText('Aucun objectif fixé')).toBeTruthy())
  })

  it('annonce l absence de technique activee au lieu d un ecran vide', async () => {
    mockConfig.mockResolvedValue({
      enabledTechniques: [], primaryTechnique: null, weeklyGoalSessions: 3,
    })
    render(<BreathingPatientView patientModuleId="pm1" />, { wrapper })
    await waitFor(() => expect(screen.getByText('Aucune technique activée pour ce patient.')).toBeTruthy())
  })

  it('filtre le rail sans renumeroter les ecrans', async () => {
    render(<BreathingPatientView patientModuleId="pm1" />, { wrapper })
    await screen.findByText('1 · Accueil')
    fireEvent.click(screen.getByText('Clôture'))
    expect(screen.getByText('4 · Clôture')).toBeTruthy()
    expect(screen.queryByText('1 · Accueil')).toBeNull()
  })

  it('porte le bandeau de lecture seule et n expose aucun controle actionnable', async () => {
    const { container } = render(<BreathingPatientView patientModuleId="pm1" />, { wrapper })
    await screen.findByText('1 · Accueil')
    expect(screen.getByText(/Aperçu lecture seule/)).toBeTruthy()
    // Les miniatures elles-memes ne portent aucun controle : les seuls boutons de la
    // page sont ceux de la coquille (puces de filtre, fleches de defilement du rail).
    expect(container.querySelectorAll('.psr-screen__frame button')).toHaveLength(0)
    expect(container.querySelectorAll('.psr-screen__frame a')).toHaveLength(0)
    expect(container.querySelectorAll('.psr-screen__frame input')).toHaveLength(0)
  })

  it('donne une teinte unique aux trois reponses de ressenti', async () => {
    const { container } = render(<BreathingPatientView patientModuleId="pm1" />, { wrapper })
    await screen.findByText('4 · Clôture')
    const borders = [...container.querySelectorAll('.bpv-feeling')].map(n => (n as HTMLElement).style.borderColor)
    expect(borders).toHaveLength(3)
    expect(new Set(borders).size).toBe(1)
  })

  it('n affiche aucune cle i18n brute', async () => {
    const { container } = render(<BreathingPatientView patientModuleId="pm1" />, { wrapper })
    await screen.findByText('1 · Accueil')
    expect(container.textContent).not.toMatch(/patient\.bpv_|modules\.breathing_techniques\./)
  })
})
