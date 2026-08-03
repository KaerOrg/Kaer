import { render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { EmotionNamingPatientView } from './EmotionNamingPatientView'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { count?: number }) =>
      opts?.count != null ? `${key}:${opts.count}` : key,
  }),
}))

// Taxonomie lue en base : deux familles et leur teinte, une nuance, un mot.
vi.mock('@services/moduleService', () => ({
  fetchModuleFields: async () => ({
    preview_kind: 'tree_selector',
    fields: [
      {
        id: 'ew.cfg', field_type: 'tree_selector_config', text_code: null,
        props: { intensity_max: '5', context_opt_1: 'modules.emotion_wheel.context.work' },
      },
      {
        id: 'ew.fear', field_type: 'tree_node', text_code: 'modules.emotion_wheel.node.fear',
        props: { color: '#AC9BDE' }, children: [],
      },
      {
        id: 'ew.joy', field_type: 'tree_node', text_code: 'modules.emotion_wheel.node.joy',
        props: { color: '#EFC98A' }, children: [],
      },
    ],
  }),
}))

vi.mock('@services/moduleAssignmentService', () => ({
  fetchDefusionTechniques: async () => [],
}))

function renderView() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <EmotionNamingPatientView />
    </QueryClientProvider>
  )
}

describe('EmotionNamingPatientView', () => {
  it('rend les NEUF écrans du parcours, chacun numéroté et légendé', async () => {
    const { container } = renderView()
    await screen.findByText('patient.enpv_cap_first_open', { exact: false })

    const screens = container.querySelectorAll('.psr-screen')
    expect(screens).toHaveLength(9)
    const captions = [...container.querySelectorAll('.psr-screen__caption')].map(c => c.textContent)
    expect(captions[0]).toBe('1 · patient.enpv_cap_first_open')
    expect(captions[8]).toBe('9 · patient.enpv_cap_reminders')
  })

  it('les filtres réduisent le rail SANS casser la numérotation affichée', async () => {
    const { container } = renderView()
    await screen.findByText('patient.enpv_cap_first_open', { exact: false })

    await userEvent.click(screen.getByText('patient.enpv_filter_settings'))
    const captions = [...container.querySelectorAll('.psr-screen__caption')].map(c => c.textContent)
    // L'écran des rappels reste le neuvième, même seul dans le rail.
    expect(captions).toEqual(['9 · patient.enpv_cap_reminders'])
  })

  it('le filtre « Saisie » regroupe les trois étapes du parcours', async () => {
    const { container } = renderView()
    await screen.findByText('patient.enpv_cap_first_open', { exact: false })

    await userEvent.click(screen.getByText('patient.enpv_filter_entry'))
    const captions = [...container.querySelectorAll('.psr-screen__caption')].map(c => c.textContent)
    expect(captions).toEqual([
      '3 · patient.enpv_cap_family',
      '4 · patient.enpv_cap_nuance',
      '5 · patient.enpv_cap_sheet',
    ])
  })

  it('aucun élément de l\'aperçu n\'est actionnable', async () => {
    const { container } = renderView()
    await screen.findByText('patient.enpv_cap_first_open', { exact: false })

    // Les seuls boutons de la vue sont les puces de filtre du praticien.
    const buttons = [...container.querySelectorAll('button')]
    const rail = container.querySelector('.psr-rail')
    expect(buttons.length).toBeGreaterThan(0)
    expect(within(rail as HTMLElement).queryAllByRole('button')).toHaveLength(0)
    expect((rail as HTMLElement).querySelectorAll('input, a, select, textarea')).toHaveLength(0)
  })

  it('lit la taxonomie en base : familles et teintes viennent de la config', async () => {
    const { container } = renderView()
    // Attendre la grille elle-même : le rail se rend avant que la config arrive.
    await waitFor(() => expect(container.querySelectorAll('.enpv-family')).toHaveLength(2))

    const families = [...container.querySelectorAll('.enpv-family')]
    expect(families.map(f => f.textContent)).toEqual([
      'modules.emotion_wheel.node.fear',
      'modules.emotion_wheel.node.joy',
    ])
    expect((families[0] as HTMLElement).style.borderColor).toBeTruthy()
  })

  it('rend l\'intensité sur la borne lue en config, sans label interprétatif', async () => {
    const { container } = renderView()
    await screen.findByText('patient.enpv_cap_sheet', { exact: false })

    // intensity_max = 5 en config → cinq crans, quatre remplis pour l'exemple.
    expect(container.querySelectorAll('.enpv-step')).toHaveLength(5)
    expect(container.querySelectorAll('.enpv-step--on')).toHaveLength(4)
    expect(container.textContent).not.toMatch(/sévère|élevé|faible|alerte/i)
  })

  it('annonce neuf écrans en pied de rail', async () => {
    renderView()
    expect(await screen.findByText('patient.enpv_footer:9')).toBeInTheDocument()
  })
})
