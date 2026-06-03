import { vi, describe, it, expect, beforeEach } from 'vitest'

const fetchTrackedEffects = vi.fn()
const updateTrackedEffects = vi.fn()

vi.mock('../../../services/moduleAssignmentService', () => ({
  fetchTrackedEffects: (...a: unknown[]) => fetchTrackedEffects(...a),
  updateTrackedEffects: (...a: unknown[]) => updateTrackedEffects(...a),
}))
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }))
vi.mock('../../../contexts/ToastContext', () => ({ useToast: () => ({ error: vi.fn(), success: vi.fn() }) }))

import { renderHook, act, waitFor } from '@testing-library/react'
import { useMedicationEffectsEditor } from './useMedicationEffectsEditor'
import type { PatientModule } from '../../../lib/database.types'

const modules = [{ id: 'pm1', module_type: 'medication_side_effects' } as unknown as PatientModule]
const onReload = vi.fn().mockResolvedValue(undefined)

describe('useMedicationEffectsEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fetchTrackedEffects.mockResolvedValue([{ key: 'sedation' }])
    updateTrackedEffects.mockResolvedValue({ ok: true })
  })

  it('openEditor charge les effets suivis depuis le service', async () => {
    const { result } = renderHook(() => useMedicationEffectsEditor(modules, onReload))
    await act(async () => { await result.current.openEditor() })
    expect(fetchTrackedEffects).toHaveBeenCalledWith('pm1')
    expect(result.current.open).toBe(true)
    expect(result.current.tracked).toEqual([{ key: 'sedation' }])
  })

  it('toggleFixed ajoute puis retire un effet et persiste', async () => {
    const { result } = renderHook(() => useMedicationEffectsEditor(modules, onReload))
    await act(async () => { await result.current.openEditor() })

    await act(async () => { result.current.toggleFixed('nausea') })
    await waitFor(() => expect(updateTrackedEffects).toHaveBeenCalledWith('pm1', [{ key: 'sedation' }, { key: 'nausea' }]))

    await act(async () => { result.current.toggleFixed('sedation') })
    await waitFor(() => expect(updateTrackedEffects).toHaveBeenLastCalledWith('pm1', [{ key: 'nausea' }]))
  })

  it('addCustom ajoute un effet personnalisé avec clé c_ + couleur', async () => {
    const { result } = renderHook(() => useMedicationEffectsEditor(modules, onReload))
    await act(async () => { await result.current.openEditor() })
    await act(async () => { result.current.addCustom('Bouffées de chaleur') })
    await waitFor(() => {
      const arg = updateTrackedEffects.mock.calls.at(-1)?.[1] as { key: string; custom?: boolean; label?: string; color?: string }[]
      const custom = arg.find(e => e.custom)
      expect(custom?.label).toBe('Bouffées de chaleur')
      expect(custom?.key.startsWith('c_')).toBe(true)
      expect(custom?.color).toBeTruthy()
    })
  })

  it('addCustom ignore un libellé vide', async () => {
    const { result } = renderHook(() => useMedicationEffectsEditor(modules, onReload))
    await act(async () => { await result.current.openEditor() })
    updateTrackedEffects.mockClear()
    await act(async () => { result.current.addCustom('   ') })
    expect(updateTrackedEffects).not.toHaveBeenCalled()
  })
})
