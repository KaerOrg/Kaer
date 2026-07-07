import { describe, it, expect, vi } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: 'fr' } }),
}))

import { render, screen, fireEvent } from '@testing-library/react'
import { ChronobiologyCard, type ChronobiologyCardProps } from './ChronobiologyCard'
import type { PatientModule } from '../../../lib/database.types'
import type { ModuleItem } from '@services/moduleCatalogService'

const MOD_ITEM: ModuleItem = { id: 'chronobiology_tracker', icon: 'clock', mobile_icon: 'clock', color: '#06B6D4' }
const MOD: PatientModule = {
  id: 'pm1', patient_id: 'p1', practitioner_id: 'pr1',
  module_type: 'chronobiology_tracker', config: {}, unlocked_at: '2026-06-01T00:00:00Z',
}

function renderCard(props: Partial<ChronobiologyCardProps> = {}) {
  const onToggleData = vi.fn()
  const onTogglePreview = vi.fn()
  const defaults: ChronobiologyCardProps = {
    tagChips: null,
    modItem: MOD_ITEM,
    modIcon: null,
    mod: MOD,
    unlocked: true,
    loading: false,
    previewOpen: false,
    dataOpen: false,
    moduleToggle: () => null,
    onTogglePreview,
    onToggleData,
    onConfigureNotif: vi.fn(),
    onUnlock: vi.fn(),
    onRevoke: vi.fn(),
    ...props,
  }
  return { onToggleData, onTogglePreview, ...render(<ChronobiologyCard {...defaults} />) }
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

  it('déclenche onTogglePreview au clic sur « Aperçu » (ouvre la modale côté parent)', () => {
    const { onTogglePreview } = renderCard()
    fireEvent.click(screen.getByRole('button', { name: 'patient.preview_button' }))
    expect(onTogglePreview).toHaveBeenCalledWith('chronobiology_tracker')
  })

  it('déclenche onToggleData au clic sur « Données » (ouvre la modale côté parent)', () => {
    const { onToggleData } = renderCard()
    fireEvent.click(screen.getByRole('button', { name: 'patient.data_button' }))
    expect(onToggleData).toHaveBeenCalledWith('chronobiology_tracker')
  })

  it('ne rend aucun panneau inline dans la carte', () => {
    renderCard({ previewOpen: true, dataOpen: false })
    expect(screen.queryByTestId('preview-panel')).toBeNull()
    expect(screen.queryByTestId('data-panel')).toBeNull()
  })

  it('n’affiche pas les actions si le module n’est pas débloqué', () => {
    renderCard({ unlocked: false, mod: undefined })
    expect(screen.queryByRole('button', { name: 'patient.data_button' })).toBeNull()
  })
})
