import { vi, beforeEach, describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ModulePreviewPanel } from './ModulePreviewPanel'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

// Les deux panneaux (vue patient + sources) ont leurs propres tests/fetchs — stubs
// pour isoler le basculement des sous-onglets.
vi.mock('./ModulePatientViewPanel', () => ({
  ModulePatientViewPanel: () => <div data-testid="patient-view" />,
}))
vi.mock('../ModuleSources/ModuleSourcesPanel', () => ({
  ModuleSourcesPanel: () => <div data-testid="sources-panel" />,
}))

beforeEach(() => vi.clearAllMocks())

describe('ModulePreviewPanel', () => {
  it('affiche la vue patient par défaut', () => {
    render(<ModulePreviewPanel moduleType="phq9" />)
    expect(screen.getByTestId('patient-view')).toBeInTheDocument()
    expect(screen.queryByTestId('sources-panel')).not.toBeInTheDocument()
  })

  it('bascule sur les sources au clic du sous-onglet', async () => {
    render(<ModulePreviewPanel moduleType="phq9" />)
    await userEvent.click(screen.getByText('patient.sources_tab'))
    expect(screen.getByTestId('sources-panel')).toBeInTheDocument()
    expect(screen.queryByTestId('patient-view')).not.toBeInTheDocument()
  })
})
