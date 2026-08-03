import { vi } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'fr' } }),
}))

// Sonde de la modale : capte le module + l'onglet demandés, sans rendre le contenu réel.
const modalCalls: { module: string; activeTab: string }[] = []
vi.mock('./ModuleActionsModal', () => ({
  ModuleActionsModal: ({ module, activeTab }: { module: string; activeTab: string }) => {
    modalCalls.push({ module, activeTab })
    return <div data-testid="actions-modal" data-module={module} data-tab={activeTab} />
  },
}))

// Sonde du sous-onglet Évolution : expose la famille reçue et un bouton « Voir les
// données » qui déclenche onOpenModuleData, sans monter les vraies courbes.
const evoProps: { family?: string }[] = []
vi.mock('./PatientEvolutionTab', () => ({
  PatientEvolutionTab: ({ family, onOpenModuleData }: { family?: string; onOpenModuleData?: (m: string) => void }) => {
    evoProps.push({ family })
    return (
      <button data-testid="evo-view-data" onClick={() => onOpenModuleData?.('sleep_diary')}>voir</button>
    )
  },
}))

// Taxonomie vide : le tableau rend les lignes sans puce d'indication.
vi.mock('@services/moduleCatalogService', () => ({
  fetchModuleTaxonomy: async () => ({ dimensions: [], tagsByDimension: new Map(), tagsByModule: new Map() }),
}))

import { render, waitFor, fireEvent, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastProvider } from '../../../contexts/ToastProvider'
import { PatientModulesTab } from './PatientModulesTab'
import type { ModuleType, PatientModule } from '../../../lib/database.types'
import type { ModuleCategory } from '@services/moduleCatalogService'

const makeClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } })

function renderTab(props: Partial<React.ComponentProps<typeof PatientModulesTab>> = {}) {
  return render(
    <QueryClientProvider client={makeClient()}>
      <ToastProvider>
        <PatientModulesTab
          patientId="p1"
          practitionerId="pr1"
          modules={[]}
          categories={[]}
          enabledModules={new Set()}
          libraryTopics={[]}
          themes={[]}
          comingSoonIds={new Set()}
          onReloadModules={async () => {}}
          {...props}
        />
      </ToastProvider>
    </QueryClientProvider>,
  )
}

function goToEvolution() {
  fireEvent.click(screen.getByRole('tab', { name: /patient\.tab_evolution/ }))
}

beforeEach(() => {
  modalCalls.length = 0
  evoProps.length = 0
})

describe('PatientModulesTab : sous-onglets Actifs / Évolution (K-2)', () => {
  it('sous-onglet Actifs par défaut : Évolution non montée, aucune modale', () => {
    renderTab()
    expect(screen.queryByTestId('evo-view-data')).toBeNull()
    expect(modalCalls.length).toBe(0)
  })

  it('bascule sur Évolution : monte PatientEvolutionTab filtré aux modules', async () => {
    renderTab()
    goToEvolution()
    await waitFor(() => expect(screen.getByTestId('evo-view-data')).toBeTruthy())
    expect(evoProps.at(-1)?.family).toBe('modules')
  })

  it('« Voir les données → » depuis l’Évolution ouvre la modale sur l’onglet Données', async () => {
    renderTab()
    goToEvolution()
    fireEvent.click(screen.getByTestId('evo-view-data'))
    await waitFor(() => expect(modalCalls.length).toBeGreaterThan(0))
    expect(modalCalls.at(-1)).toEqual({ module: 'sleep_diary', activeTab: 'data' })
  })
})

describe('PatientModulesTab : clic de ligne ouvre la fiche du module (K-3)', () => {
  const CATEGORIES: ModuleCategory[] = [{
    id: 'cat', icon: '', labelKey: 'c.label', subtitleKey: 'c.sub',
    modules: [{ id: 'sleep_diary', icon: '', mobile_icon: '', color: '' }],
  }]
  const MODULES: PatientModule[] = [{
    id: 'pm1', patient_id: 'p1', practitioner_id: 'pr1',
    module_type: 'sleep_diary', config: {}, unlocked_at: '2026-01-01T00:00:00Z',
  }]
  const ENABLED = new Set<ModuleType>(['sleep_diary'])

  it('clic sur la ligne ouvre la modale sur le premier onglet (Données)', async () => {
    renderTab({ categories: CATEGORIES, modules: MODULES, enabledModules: ENABLED })
    await waitFor(() => expect(screen.getByText('modules.sleep_diary.label')).toBeTruthy())
    // Clic sur le nom (surface non interactive) → ouverture de la fiche.
    fireEvent.click(screen.getByText('modules.sleep_diary.label'))
    await waitFor(() => expect(modalCalls.length).toBeGreaterThan(0))
    expect(modalCalls.at(-1)).toEqual({ module: 'sleep_diary', activeTab: 'data' })
  })
})
