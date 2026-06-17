import { describe, it, expect, vi } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: 'fr' } }),
}))
vi.mock('../../../components/features/ModulePreviewPanel', () => ({ ModulePreviewPanel: () => null }))
vi.mock('./ModuleDataPanel', () => ({ ModuleDataPanel: () => null }))

import { render, screen, fireEvent } from '@testing-library/react'
import { ChronobiologyCard, type ChronobiologyCardProps } from './ChronobiologyCard'
import type { PatientModule } from '../../../lib/database.types'
import type { ModuleItem } from '../../../services/moduleCatalogService'

const CATALOG = [
  { key: 'wake_time', textCode: 'modules.chrono_bio.wake_time' },
  { key: 'light', textCode: 'modules.chrono_bio.light' },
]

function makeAnchors(overrides: Partial<ChronobiologyCardProps['anchors']> = {}) {
  return {
    module: { id: 'pm1' } as unknown as PatientModule,
    open: true,
    catalog: CATALOG,
    selected: ['wake_time'],
    saving: false,
    openEditor: vi.fn(),
    close: vi.fn(),
    toggle: vi.fn(),
    isSelected: (k: string) => k === 'wake_time',
    ...overrides,
  }
}

function renderCard(props: Partial<ChronobiologyCardProps> = {}) {
  const anchors = props.anchors ?? makeAnchors()
  const defaults: ChronobiologyCardProps = {
    patientId: 'pat1',
    tagChips: null,
    modItem: { id: 'chronobiology_tracker', color: '#06B6D4' } as unknown as ModuleItem,
    modIcon: null,
    mod: { id: 'pm1', unlocked_at: '2026-06-01' } as unknown as PatientModule,
    unlocked: true,
    loading: false,
    previewOpen: false,
    dataOpen: false,
    anchors,
    moduleToggle: () => null,
    onTogglePreview: vi.fn(),
    onToggleData: vi.fn(),
    onUnlock: vi.fn(),
    onRevoke: vi.fn(),
    ...props,
  }
  return { anchors, ...render(<ChronobiologyCard {...defaults} />) }
}

describe('ChronobiologyCard', () => {
  it('affiche le titre et l’éditeur d’ancres quand débloqué et ouvert', () => {
    renderCard()
    expect(screen.getByText('modules.chronobiology_tracker.label')).toBeTruthy()
    // une case par ancre du catalogue
    expect(screen.getAllByRole('checkbox')).toHaveLength(2)
    expect(screen.getByText('modules.chrono_bio.wake_time')).toBeTruthy()
    expect(screen.getByText('modules.chrono_bio.light')).toBeTruthy()
  })

  it('coche les ancres sélectionnées (wake_time) et pas les autres (light)', () => {
    renderCard()
    const boxes = screen.getAllByRole('checkbox') as HTMLInputElement[]
    expect(boxes[0].checked).toBe(true)   // wake_time
    expect(boxes[1].checked).toBe(false)  // light
  })

  it('bascule une ancre au clic via le hook', () => {
    const { anchors } = renderCard()
    const boxes = screen.getAllByRole('checkbox')
    fireEvent.click(boxes[1])
    expect(anchors.toggle).toHaveBeenCalledWith('light')
  })

  it('n’affiche pas l’éditeur si le module n’est pas débloqué', () => {
    renderCard({ unlocked: false, mod: undefined })
    expect(screen.queryByRole('checkbox')).toBeNull()
  })
})
