import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { BreathingConfigPanel } from './BreathingConfigPanel'
import type { BreathingPractitionerConfig } from '@services/moduleAssignmentService'

// Config des techniques : lue en base par le moteur générique, mockée ici au niveau
// du service (le panneau, lui, passe bien par la factory `moduleQueries.fields`).
vi.mock('@services/moduleService', () => ({
  fetchModuleFields: vi.fn().mockResolvedValue({
    preview_kind: 'breathing_pacer',
    fields: [
      {
        field_type: 'breathing_technique', sort_order: 100,
        props: { technique_key: 'coherence_cardiaque', color: '#4A9EA3', recommended_duration_min: '5' },
        children: [
          { field_type: 'breathing_phase', sort_order: 1, props: { phase_type: 'inhale', phase_seconds: '5' }, children: [] },
          { field_type: 'breathing_phase', sort_order: 2, props: { phase_type: 'exhale', phase_seconds: '5' }, children: [] },
        ],
      },
      {
        field_type: 'breathing_technique', sort_order: 110,
        props: { technique_key: 'diaphragmatique', color: '#5FAE9B', recommended_duration_min: '5' },
        children: [
          { field_type: 'breathing_phase', sort_order: 1, props: { phase_type: 'inhale', phase_seconds: '4' }, children: [] },
          { field_type: 'breathing_phase', sort_order: 2, props: { phase_type: 'exhale', phase_seconds: '7' }, children: [] },
        ],
      },
    ],
  }),
}))

vi.mock('@services/moduleAssignmentService', () => ({
  fetchBreathingPractitionerConfig: vi.fn(),
  updateBreathingPractitionerConfig: vi.fn(),
  fetchDefusionTechniques: vi.fn(),
}))

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

const DRAFT: BreathingPractitionerConfig = {
  enabledTechniques: ['coherence_cardiaque'],
  primaryTechnique: 'coherence_cardiaque',
  weeklyGoalSessions: 5,
}

function makeEditor(over: Partial<{ draft: BreathingPractitionerConfig | null }> = {}) {
  return {
    module: { id: 'pm-1' },
    draft: 'draft' in over ? over.draft : DRAFT,
    saving: false,
    openEditor: vi.fn(),
    toggleTechnique: vi.fn(),
    setPrimary: vi.fn(),
    setGoal: vi.fn(),
    save: vi.fn().mockResolvedValue(true),
  } as unknown as Parameters<typeof BreathingConfigPanel>[0]['breathingConfig']
}

function renderPanel(editor = makeEditor(), onClose = vi.fn()) {
  render(<BreathingConfigPanel breathingConfig={editor} onClose={onClose} />, { wrapper })
  return { editor, onClose }
}

beforeEach(() => vi.clearAllMocks())

describe('BreathingConfigPanel : W0', () => {
  it('n’affiche aucun formulaire tant que la config n’est pas lue', () => {
    renderPanel(makeEditor({ draft: null }))
    expect(screen.queryByTestId('breathing-goal-input')).toBeNull()
  })

  it('liste les techniques déclarées en base, avec leur rythme', async () => {
    renderPanel()
    expect(await screen.findByText('4s · 7s')).toBeTruthy()
    expect(screen.getByText('5s · 5s')).toBeTruthy()
  })

  // Ce test manquait, et c'est ce qui a laissé passer des clés i18n brutes à
  // l'écran : les locales web ne portaient aucun nom de technique. Asserter sur le
  // NOM, pas seulement sur le rythme et les testid, est ce qui l'attrape.
  it('affiche le nom traduit des techniques, jamais leur clé i18n', async () => {
    renderPanel()
    expect(await screen.findByText('Cohérence cardiaque')).toBeTruthy()
    expect(screen.getByText('Respiration diaphragmatique')).toBeTruthy()
    expect(screen.queryByText(/modules\.breathing_techniques\./)).toBeNull()
  })

  it('marque la technique de séance et n’en marque qu’une', async () => {
    renderPanel()
    await screen.findByText('5s · 5s')
    expect(screen.getByTestId('breathing-primary-coherence_cardiaque')).toBeTruthy()
    expect(screen.queryByTestId('breathing-primary-diaphragmatique')).toBeNull()
  })

  it('ne propose de désigner « en séance » que sur une technique activée', async () => {
    renderPanel()
    await screen.findByText('5s · 5s')
    // diaphragmatique n'est pas activée : aucun bouton de désignation.
    expect(screen.queryByTestId('breathing-set-primary-diaphragmatique')).toBeNull()
  })

  it('remonte la désignation d’une autre technique activée', async () => {
    const editor = makeEditor()
    ;(editor as unknown as { draft: BreathingPractitionerConfig }).draft = {
      ...DRAFT, enabledTechniques: ['coherence_cardiaque', 'diaphragmatique'],
    }
    renderPanel(editor)
    fireEvent.click(await screen.findByTestId('breathing-set-primary-diaphragmatique'))
    expect(editor.setPrimary).toHaveBeenCalledWith('diaphragmatique')
  })

  it('affiche l’objectif en sessions par semaine, jamais en minutes', async () => {
    renderPanel()
    await screen.findByText('5s · 5s')
    expect((screen.getByTestId('breathing-goal-input') as HTMLInputElement).value).toBe('5')
    expect(screen.getByText('sessions / semaine')).toBeTruthy()
    expect(screen.queryByText(/minute/i)).toBeNull()
  })

  it('borne l’objectif aux valeurs acceptées par la base', async () => {
    const { editor } = renderPanel()
    await screen.findByText('5s · 5s')
    fireEvent.change(screen.getByTestId('breathing-goal-input'), { target: { value: '99' } })
    expect(editor.setGoal).toHaveBeenCalledWith(14)
    fireEvent.change(screen.getByTestId('breathing-goal-input'), { target: { value: '0' } })
    expect(editor.setGoal).toHaveBeenCalledWith(1)
  })

  it('rappelle que l’objectif reste ajustable par le patient', async () => {
    renderPanel()
    await screen.findByText('5s · 5s')
    expect(screen.getByText(/ajuster librement/)).toBeTruthy()
  })

  it('enregistre puis referme', async () => {
    const { editor, onClose } = renderPanel()
    await screen.findByText('5s · 5s')
    fireEvent.click(screen.getByText('Enregistrer'))
    await waitFor(() => expect(editor.save).toHaveBeenCalled())
    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })

  it('referme sans enregistrer sur Annuler', async () => {
    const { editor, onClose } = renderPanel()
    await screen.findByText('5s · 5s')
    fireEvent.click(screen.getByText('Annuler'))
    expect(onClose).toHaveBeenCalled()
    expect(editor.save).not.toHaveBeenCalled()
  })
})
