import { vi, describe, it, expect, beforeEach } from 'vitest'

const unlockPsychoeducation = vi.fn()
const updatePsychoeducationTopics = vi.fn()

vi.mock('@services/moduleAssignmentService', () => ({
  unlockPsychoeducation: (...a: unknown[]) => unlockPsychoeducation(...a),
  updatePsychoeducationTopics: (...a: unknown[]) => updatePsychoeducationTopics(...a),
}))
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }))
vi.mock('../../../contexts/ToastContext', () => ({ useToast: () => ({ error: vi.fn(), success: vi.fn() }) }))

import { renderHook, act } from '@testing-library/react'
import { usePsychoEducationPicker } from './usePsychoEducationPicker'
import type { PatientModule } from '../../../lib/database.types'

const psychoModule: PatientModule = {
  id: 'pm-psy',
  patient_id: 'pat-1',
  practitioner_id: 'prac-1',
  module_type: 'psychoeducation',
  config: { unlocked_topics: [{ topic_id: 'tp1' }, { topic_id: 'tp2' }] },
  unlocked_at: '2026-06-01T00:00:00Z',
}
const onReload = vi.fn().mockResolvedValue(undefined)

describe('usePsychoEducationPicker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    unlockPsychoeducation.mockResolvedValue({ ok: true })
    updatePsychoeducationTopics.mockResolvedValue({ ok: true })
  })

  it('open("unlock") démarre avec AUCUNE fiche cochée', () => {
    const { result } = renderHook(() => usePsychoEducationPicker([], 'pat-1', 'prac-1', onReload))
    act(() => { result.current.open('unlock') })
    expect(result.current.mode).toBe('unlock')
    expect(result.current.selectedTopicIds.size).toBe(0)
  })

  it('open("edit") pré-coche les fiches déjà débloquées', () => {
    const { result } = renderHook(() => usePsychoEducationPicker([psychoModule], 'pat-1', 'prac-1', onReload))
    act(() => { result.current.open('edit') })
    expect(result.current.mode).toBe('edit')
    expect(result.current.selectedTopicIds).toEqual(new Set(['tp1', 'tp2']))
  })

  it('toggleTopic ajoute puis retire une fiche', () => {
    const { result } = renderHook(() => usePsychoEducationPicker([], 'pat-1', 'prac-1', onReload))
    act(() => { result.current.open('unlock') })
    act(() => { result.current.toggleTopic('tpX') })
    expect(result.current.selectedTopicIds.has('tpX')).toBe(true)
    act(() => { result.current.toggleTopic('tpX') })
    expect(result.current.selectedTopicIds.has('tpX')).toBe(false)
  })

  it('confirm sans sélection affiche une erreur et n’appelle pas le service', async () => {
    const { result } = renderHook(() => usePsychoEducationPicker([], 'pat-1', 'prac-1', onReload))
    act(() => { result.current.open('unlock') })
    await act(async () => { await result.current.confirm() })
    expect(result.current.error).toBe('patient.psycho_pick_error')
    expect(unlockPsychoeducation).not.toHaveBeenCalled()
  })

  it('confirm en mode unlock avec sélection appelle unlockPsychoeducation', async () => {
    const { result } = renderHook(() => usePsychoEducationPicker([], 'pat-1', 'prac-1', onReload))
    act(() => { result.current.open('unlock') })
    act(() => { result.current.toggleTopic('tp1') })
    await act(async () => { await result.current.confirm() })
    expect(unlockPsychoeducation).toHaveBeenCalledWith('pat-1', 'prac-1', new Set(['tp1']))
    expect(onReload).toHaveBeenCalled()
  })
})
