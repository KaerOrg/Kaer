import { vi, describe, it, expect, beforeEach } from 'vitest'

const fetchChronoAnchorCatalog = vi.fn()
const fetchTrackedAnchors = vi.fn()
const updateTrackedAnchors = vi.fn()

vi.mock('../../../services/moduleAssignmentService', () => ({
  fetchChronoAnchorCatalog: (...a: unknown[]) => fetchChronoAnchorCatalog(...a),
  fetchTrackedAnchors: (...a: unknown[]) => fetchTrackedAnchors(...a),
  updateTrackedAnchors: (...a: unknown[]) => updateTrackedAnchors(...a),
}))
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }))
vi.mock('../../../contexts/ToastContext', () => ({ useToast: () => ({ error: vi.fn(), success: vi.fn() }) }))

import { renderHook, act, waitFor } from '@testing-library/react'
import { useChronoAnchorsEditor } from './useChronoAnchorsEditor'
import type { PatientModule } from '../../../lib/database.types'

const modules = [{ id: 'pm1', module_type: 'chronobiology_tracker' } as unknown as PatientModule]
const onReload = vi.fn().mockResolvedValue(undefined)
const CATALOG = [
  { key: 'wake_time', textCode: 'modules.chrono_bio.wake_time' },
  { key: 'first_meal', textCode: 'modules.chrono_bio.first_meal' },
  { key: 'light', textCode: 'modules.chrono_bio.light' },
]

describe('useChronoAnchorsEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fetchChronoAnchorCatalog.mockResolvedValue(CATALOG)
    fetchTrackedAnchors.mockResolvedValue([])
    updateTrackedAnchors.mockResolvedValue({ ok: true })
  })

  it('openEditor : config vide → toutes les ancres sélectionnées (défaut)', async () => {
    const { result } = renderHook(() => useChronoAnchorsEditor(modules, onReload))
    await act(async () => { await result.current.openEditor() })

    expect(fetchChronoAnchorCatalog).toHaveBeenCalled()
    expect(fetchTrackedAnchors).toHaveBeenCalledWith('pm1')
    expect(result.current.open).toBe(true)
    expect(result.current.catalog).toEqual(CATALOG)
    expect(result.current.selected).toEqual(['wake_time', 'first_meal', 'light'])
  })

  it('openEditor : sélection existante respectée', async () => {
    fetchTrackedAnchors.mockResolvedValue(['wake_time', 'light'])
    const { result } = renderHook(() => useChronoAnchorsEditor(modules, onReload))
    await act(async () => { await result.current.openEditor() })

    expect(result.current.selected).toEqual(['wake_time', 'light'])
    expect(result.current.isSelected('first_meal')).toBe(false)
    expect(result.current.isSelected('light')).toBe(true)
  })

  it('toggle retire une ancre et persiste le reste', async () => {
    const { result } = renderHook(() => useChronoAnchorsEditor(modules, onReload))
    await act(async () => { await result.current.openEditor() })

    await act(async () => { result.current.toggle('first_meal') })
    await waitFor(() =>
      expect(updateTrackedAnchors).toHaveBeenCalledWith('pm1', ['wake_time', 'light']),
    )
    expect(onReload).toHaveBeenCalled()
  })

  it('toggle de la dernière ancre : garde-fou, ne persiste pas', async () => {
    fetchTrackedAnchors.mockResolvedValue(['wake_time'])
    const { result } = renderHook(() => useChronoAnchorsEditor(modules, onReload))
    await act(async () => { await result.current.openEditor() })

    await act(async () => { result.current.toggle('wake_time') })
    expect(updateTrackedAnchors).not.toHaveBeenCalled()
  })
})
