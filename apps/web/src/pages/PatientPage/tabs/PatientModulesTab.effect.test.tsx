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

import { render, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastProvider } from '../../../contexts/ToastProvider'
import { PatientModulesTab } from './PatientModulesTab'

const makeClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } })

function renderTab(props: Partial<React.ComponentProps<typeof PatientModulesTab>>) {
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

beforeEach(() => {
  modalCalls.length = 0
})

describe('PatientModulesTab — commande openDataFor (« Voir les données → »)', () => {
  it('ouvre la modale sur l’onglet Données du module demandé et accuse réception', async () => {
    const onOpenDataHandled = vi.fn()
    renderTab({ openDataFor: 'sleep_diary', onOpenDataHandled })
    await waitFor(() => expect(modalCalls.length).toBeGreaterThan(0))
    expect(modalCalls.at(-1)).toEqual({ module: 'sleep_diary', activeTab: 'data' })
    expect(onOpenDataHandled).toHaveBeenCalledTimes(1)
  })

  it('sans commande : aucune modale ouverte', async () => {
    const { queryByTestId } = renderTab({ openDataFor: null })
    await waitFor(() => expect(queryByTestId('actions-modal')).toBeNull())
    expect(modalCalls.length).toBe(0)
  })
})
