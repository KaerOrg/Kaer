import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: 'fr' } }),
}))
// Panneaux lourds (self-fetch react-query) — mockés : on teste l'aiguillage de la modale.
vi.mock('../../../components/features/ModulePreviewPanel', () => ({
  ModulePreviewPanel: ({ moduleType, color }: { moduleType: string; color?: string }) => (
    <div data-testid="preview-panel" data-module={moduleType} data-color={color} />
  ),
}))
vi.mock('./ModuleDataPanel', () => ({
  ModuleDataPanel: ({ patientId, moduleType }: { patientId: string; moduleType: string }) => (
    <div data-testid="data-panel" data-patient={patientId} data-module={moduleType} />
  ),
}))

import { render, screen, fireEvent } from '@testing-library/react'
import { ModulePanelModal } from './ModulePanelModal'

describe('ModulePanelModal', () => {
  beforeEach(() => vi.clearAllMocks())

  it('aperçu : rend ModulePreviewPanel, titre = libellé du module, sous-titre = « Aperçu »', () => {
    render(
      <ModulePanelModal
        panel={{ kind: 'preview', module: 'phq9' }}
        patientId="p1"
        color="#2C6E72"
        onClose={vi.fn()}
      />,
    )
    const panel = screen.getByTestId('preview-panel')
    expect(panel.getAttribute('data-module')).toBe('phq9')
    expect(panel.getAttribute('data-color')).toBe('#2C6E72')
    expect(screen.getByText('modules.phq9.label')).toBeTruthy()
    expect(screen.getByText('patient.preview_button')).toBeTruthy()
    expect(screen.queryByTestId('data-panel')).toBeNull()
  })

  it('données : rend ModuleDataPanel avec le patient, sous-titre = « Données »', () => {
    render(
      <ModulePanelModal
        panel={{ kind: 'data', module: 'mood_tracker' }}
        patientId="p1"
        onClose={vi.fn()}
      />,
    )
    const panel = screen.getByTestId('data-panel')
    expect(panel.getAttribute('data-module')).toBe('mood_tracker')
    expect(panel.getAttribute('data-patient')).toBe('p1')
    expect(screen.getByText('modules.mood_tracker.label')).toBeTruthy()
    expect(screen.getByText('patient.data_button')).toBeTruthy()
    expect(screen.queryByTestId('preview-panel')).toBeNull()
  })

  it('ferme la modale au clic sur le bouton de fermeture', () => {
    const onClose = vi.fn()
    render(
      <ModulePanelModal
        panel={{ kind: 'preview', module: 'phq9' }}
        patientId="p1"
        onClose={onClose}
      />,
    )
    fireEvent.click(screen.getByLabelText('Fermer'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
