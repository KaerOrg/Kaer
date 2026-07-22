import { vi, describe, it, expect, beforeEach } from 'vitest'

const fetchDefusionTechniques = vi.fn()
const updateDefusionTechniques = vi.fn()

vi.mock('@services/moduleAssignmentService', () => ({
  fetchDefusionTechniques: (...a: unknown[]) => fetchDefusionTechniques(...a),
  updateDefusionTechniques: (...a: unknown[]) => updateDefusionTechniques(...a),
}))
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }))
vi.mock('../../../contexts/ToastContext', () => ({ useToast: () => ({ error: vi.fn(), success: vi.fn() }) }))

import { renderHook, act } from '@testing-library/react'
import { useDefusionConfigEditor } from './useDefusionConfigEditor'
import type { PatientModule } from '../../../lib/database.types'

// Fabrique typée d'un PatientModule (aucun cast — cf. lessons.md).
function makeModule(over: Partial<PatientModule> = {}): PatientModule {
  return {
    id: 'pm1', patient_id: 'pt1', practitioner_id: 'pr1',
    module_type: 'cognitive_saturation', config: {}, unlocked_at: '2026-07-01',
    ...over,
  }
}
const modules = [makeModule()]
const onReload = vi.fn().mockResolvedValue(undefined)

describe('useDefusionConfigEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fetchDefusionTechniques.mockResolvedValue(['word_repetition', 'linguistic_distancing'])
    updateDefusionTechniques.mockResolvedValue({ ok: true })
  })

  it('openEditor charge les techniques activées', async () => {
    const { result } = renderHook(() => useDefusionConfigEditor(modules, onReload))
    await act(async () => { await result.current.openEditor() })
    expect(fetchDefusionTechniques).toHaveBeenCalledWith('pm1')
    expect(result.current.enabled).toEqual(['word_repetition', 'linguistic_distancing'])
  })

  it('toggle retire une technique', async () => {
    const { result } = renderHook(() => useDefusionConfigEditor(modules, onReload))
    await act(async () => { await result.current.openEditor() })
    act(() => { result.current.toggle('word_repetition') })
    expect(result.current.enabled).toEqual(['linguistic_distancing'])
  })

  it('garde : impossible de retirer la dernière technique active', async () => {
    fetchDefusionTechniques.mockResolvedValue(['word_repetition'])
    const { result } = renderHook(() => useDefusionConfigEditor(modules, onReload))
    await act(async () => { await result.current.openEditor() })
    act(() => { result.current.toggle('word_repetition') })
    expect(result.current.enabled).toEqual(['word_repetition'])
  })

  it('toggle réactive une technique en ordre canonique', async () => {
    fetchDefusionTechniques.mockResolvedValue(['linguistic_distancing'])
    const { result } = renderHook(() => useDefusionConfigEditor(modules, onReload))
    await act(async () => { await result.current.openEditor() })
    act(() => { result.current.toggle('word_repetition') })
    expect(result.current.enabled).toEqual(['word_repetition', 'linguistic_distancing'])
  })

  it('save persiste la config et recharge', async () => {
    const { result } = renderHook(() => useDefusionConfigEditor(modules, onReload))
    await act(async () => { await result.current.openEditor() })
    let ok: boolean | undefined
    await act(async () => { ok = await result.current.save() })
    expect(updateDefusionTechniques).toHaveBeenCalledWith('pm1', ['word_repetition', 'linguistic_distancing'])
    expect(onReload).toHaveBeenCalled()
    expect(ok).toBe(true)
  })

  it('save échoue → toast, pas de reload, retourne false', async () => {
    updateDefusionTechniques.mockResolvedValue({ ok: false })
    const { result } = renderHook(() => useDefusionConfigEditor(modules, onReload))
    await act(async () => { await result.current.openEditor() })
    let ok: boolean | undefined
    await act(async () => { ok = await result.current.save() })
    expect(ok).toBe(false)
    expect(onReload).not.toHaveBeenCalled()
  })
})
