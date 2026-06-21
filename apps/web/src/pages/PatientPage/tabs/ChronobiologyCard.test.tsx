import { describe, it, expect, vi } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: 'fr' } }),
}))
vi.mock('../../../components/features/ModulePreviewPanel', () => ({
  ModulePreviewPanel: () => <div data-testid="preview-panel" />,
}))
vi.mock('./ModuleDataPanel', () => ({ ModuleDataPanel: () => <div data-testid="data-panel" /> }))

import { render, screen, fireEvent } from '@testing-library/react'
import { ChronobiologyCard, type ChronobiologyCardProps } from './ChronobiologyCard'
import type { PatientModule } from '../../../lib/database.types'
import type { ModuleItem } from '../../../services/moduleCatalogService'

function renderCard(props: Partial<ChronobiologyCardProps> = {}) {
  const onToggleData = vi.fn()
  const defaults: ChronobiologyCardProps = {
    patientId: 'pat1',
    tagChips: null,
    modItem: { id: 'chronobiology_tracker', color: '#06B6D4', icon: 'clock' } as unknown as ModuleItem,
    modIcon: null,
    mod: { id: 'pm1', unlocked_at: '2026-06-01' } as unknown as PatientModule,
    unlocked: true,
    loading: false,
    previewOpen: false,
    dataOpen: false,
    moduleToggle: () => null,
    onTogglePreview: vi.fn(),
    onToggleData,
    onConfigureNotif: vi.fn(),
    onUnlock: vi.fn(),
    onRevoke: vi.fn(),
    ...props,
  }
  return { onToggleData, ...render(<ChronobiologyCard {...defaults} />) }
}

describe('ChronobiologyCard', () => {
  it('affiche le titre du module', () => {
    renderCard()
    expect(screen.getByText('modules.chronobiology_tracker.label')).toBeTruthy()
  })

  it('n’affiche aucun éditeur de configuration d’ancres', () => {
    renderCard()
    expect(screen.queryByText('modules.chronobiology_tracker.config_button')).toBeNull()
    expect(screen.queryByRole('checkbox')).toBeNull()
  })

  it('rend le panneau aperçu quand previewOpen', () => {
    renderCard({ previewOpen: true })
    expect(screen.getByTestId('preview-panel')).toBeTruthy()
  })

  it('déclenche onToggleData au clic sur « Données »', () => {
    const { onToggleData } = renderCard()
    fireEvent.click(screen.getByText('patient.data_button'))
    expect(onToggleData).toHaveBeenCalledWith('chronobiology_tracker')
  })

  it('n’affiche pas les actions si le module n’est pas débloqué', () => {
    renderCard({ unlocked: false, mod: undefined })
    expect(screen.queryByText('patient.data_button')).toBeNull()
  })
})
