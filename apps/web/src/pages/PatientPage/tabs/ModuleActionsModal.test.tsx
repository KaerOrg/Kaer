import { vi, describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ModuleActionsModal } from './ModuleActionsModal'

// `t` se comporte comme i18next : une clé DÉCLARÉE gagne, sinon on retombe sur
// `defaultValue`. Les libellés d'onglet passent par une surcharge par module
// (`modules.<id>.tab_<onglet>`), qui retombe sur le libellé commun quand le module n'en
// déclare pas. Seul `crisis_plan` en déclare une : son onglet s'appelle « Le plan ».
const DECLARED: Record<string, string> = {
  'modules.crisis_plan.tab_config': 'Le plan',
}

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string }) =>
      DECLARED[key] ?? opts?.defaultValue ?? key,
  }),
}))

// Les panneaux enfants sont mockés : on teste l'orchestration des onglets de la
// modale, pas le contenu des panneaux (couverts par leurs propres tests).
vi.mock('../../../components/features/ModulePreviewPanel', () => ({
  ModulePatientViewPanel: () => <div data-testid="preview-panel" />,
}))
vi.mock('../../../components/features/ModuleSources/ModuleSourcesPanel', () => ({
  ModuleSourcesPanel: () => <div data-testid="sources-panel" />,
}))
vi.mock('./ModuleDataPanel', () => ({
  ModuleDataPanel: () => <div data-testid="data-panel" />,
}))
vi.mock('../../../components/features/NotificationRoutinePanel/NotificationRoutinePanel', () => ({
  NotificationRoutinePanel: () => <div data-testid="notif-panel" />,
}))

const ALL_TABS = ['preview', 'sources', 'data', 'notifications'] as const

const baseProps = {
  module: 'mood_tracker' as const,
  patientId: 'pt1',
  practitionerId: 'pr1',
  patientModuleId: 'pm1',
  onTabChange: vi.fn(),
  onClose: vi.fn(),
}

beforeEach(() => vi.clearAllMocks())

describe('ModuleActionsModal', () => {
  it('affiche le panneau de l\'onglet actif et pas les autres', () => {
    render(<ModuleActionsModal {...baseProps} tabs={[...ALL_TABS]} activeTab="data" />)
    expect(screen.getByTestId('data-panel')).toBeInTheDocument()
    expect(screen.queryByTestId('preview-panel')).not.toBeInTheDocument()
    expect(screen.queryByTestId('sources-panel')).not.toBeInTheDocument()
    expect(screen.queryByTestId('notif-panel')).not.toBeInTheDocument()
  })

  it('rend un onglet par entrée de `tabs`', () => {
    render(<ModuleActionsModal {...baseProps} tabs={[...ALL_TABS]} activeTab="preview" />)
    expect(screen.getByRole('tablist')).toBeInTheDocument()
    expect(screen.getByText('patient.patient_view_tab')).toBeInTheDocument()
    expect(screen.getByText('patient.sources_tab')).toBeInTheDocument()
    expect(screen.getByText('patient.data_button')).toBeInTheDocument()
    expect(screen.getByText('notifications.modal_title')).toBeInTheDocument()
  })

  it('remonte le changement d\'onglet au parent', async () => {
    render(<ModuleActionsModal {...baseProps} tabs={[...ALL_TABS]} activeTab="preview" />)
    await userEvent.click(screen.getByText('patient.data_button'))
    expect(baseProps.onTabChange).toHaveBeenCalledWith('data')
  })

  it('n\'affiche que les onglets disponibles', () => {
    render(<ModuleActionsModal {...baseProps} tabs={['preview', 'sources']} activeTab="preview" />)
    expect(screen.getByText('patient.patient_view_tab')).toBeInTheDocument()
    expect(screen.getByText('patient.sources_tab')).toBeInTheDocument()
    expect(screen.queryByText('patient.data_button')).not.toBeInTheDocument()
    expect(screen.queryByText('notifications.modal_title')).not.toBeInTheDocument()
  })

  // Le plan de sécurité y ÉDITE son contenu, ce n'est pas un réglage : son onglet
  // s'appelle « Le plan » (PW-2). La surcharge est une clé i18n dérivée du module, pas
  // une condition sur son identifiant.
  it('un module peut renommer un onglet par une clé dérivée de son identifiant', () => {
    render(<ModuleActionsModal {...baseProps} module="crisis_plan" tabs={['config']} activeTab="config" />)
    expect(screen.getByText('Le plan')).toBeInTheDocument()
    expect(screen.queryByText('patient.config_tab')).not.toBeInTheDocument()
  })

  it('un module sans surcharge garde le libellé commun de l\'onglet', () => {
    render(<ModuleActionsModal {...baseProps} tabs={['config']} activeTab="config" />)
    expect(screen.getByText('patient.config_tab')).toBeInTheDocument()
  })

  it('ne rend pas le panneau notifications sans patientModuleId', () => {
    render(
      <ModuleActionsModal
        {...baseProps}
        patientModuleId={undefined}
        tabs={['notifications']}
        activeTab="notifications"
      />,
    )
    expect(screen.queryByTestId('notif-panel')).not.toBeInTheDocument()
  })
})
