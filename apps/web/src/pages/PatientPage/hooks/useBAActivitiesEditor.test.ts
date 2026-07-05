import { vi, describe, it, expect, beforeEach } from 'vitest'

const fetchBAActivities = vi.fn()
const updateBAActivities = vi.fn()
const fetchModuleFields = vi.fn()

vi.mock('@services/moduleAssignmentService', () => ({
  fetchBAActivities: (...a: unknown[]) => fetchBAActivities(...a),
  updateBAActivities: (...a: unknown[]) => updateBAActivities(...a),
}))
vi.mock('@services/moduleService', () => ({
  fetchModuleFields: (...a: unknown[]) => fetchModuleFields(...a),
}))
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }))
vi.mock('../../../contexts/ToastContext', () => ({ useToast: () => ({ error: vi.fn(), success: vi.fn() }) }))

import { createElement, type ReactNode } from 'react'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useBAActivitiesEditor } from './useBAActivitiesEditor'
import type { PatientModule } from '../../../lib/database.types'

const modules: PatientModule[] = [{
  id: 'pm1',
  patient_id: 'pat-1',
  practitioner_id: 'prac-1',
  module_type: 'behavioral_activation',
  config: {},
  unlocked_at: '2026-06-01T00:00:00Z',
}]
const onReload = vi.fn().mockResolvedValue(undefined)

const ACTIVITY = { id: 'a1', label: 'Marche 20 min', domain_id: 'al.dom_body', value_text: 'Mon souffle' }
const DOMAIN_FIELD = {
  id: 'al.dom_body',
  module_id: 'behavioral_activation',
  section_id: null,
  parent_field_id: null,
  field_type: 'activity_log_domain',
  text_code: 'modules.behavioral_activation.domain_body',
  sort_order: 10,
  props: {},
  children: [],
}

// Le hook consomme moduleQueries.fields via useQuery : chaque test rend dans un
// QueryClientProvider frais (pas de cache partagé entre tests).
function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return createElement(QueryClientProvider, { client }, children)
}

function renderEditor(mods: PatientModule[] = modules) {
  return renderHook(() => useBAActivitiesEditor(mods, onReload), { wrapper })
}

describe('useBAActivitiesEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fetchBAActivities.mockResolvedValue([ACTIVITY])
    updateBAActivities.mockResolvedValue({ ok: true })
    fetchModuleFields.mockResolvedValue({ preview_kind: 'activity_log', fields: [DOMAIN_FIELD] })
  })

  it('openEditor charge les activités, puis les domaines arrivent via React Query', async () => {
    const { result } = renderEditor()
    expect(fetchModuleFields).not.toHaveBeenCalled() // query désactivée tant que fermé
    await act(async () => { await result.current.openEditor() })
    expect(fetchBAActivities).toHaveBeenCalledWith('pm1')
    expect(result.current.open).toBe(true)
    expect(result.current.activities).toEqual([ACTIVITY])
    await waitFor(() => {
      expect(result.current.domains).toEqual([
        { id: 'al.dom_body', textCode: 'modules.behavioral_activation.domain_body' },
      ])
    })
  })

  it('addActivity trime, tronque et persiste (value_text vide → null)', async () => {
    const { result } = renderEditor()
    await act(async () => { await result.current.openEditor() })
    await act(async () => {
      result.current.addActivity({ label: '  Appel ami  ', domainId: 'al.dom_social', valueText: '   ' })
    })
    await waitFor(() => {
      const arg = updateBAActivities.mock.calls.at(-1)?.[1] as typeof ACTIVITY[]
      const added = arg.find(a => a.label === 'Appel ami')
      expect(added?.domain_id).toBe('al.dom_social')
      expect(added?.value_text).toBeNull()
      expect(added?.id).toBeTruthy()
    })
  })

  it('addActivity ignore un label vide ou un domaine manquant', async () => {
    const { result } = renderEditor()
    await act(async () => { await result.current.openEditor() })
    updateBAActivities.mockClear()
    await act(async () => { result.current.addActivity({ label: '   ', domainId: 'al.dom_body', valueText: '' }) })
    await act(async () => { result.current.addActivity({ label: 'Marche', domainId: '', valueText: '' }) })
    expect(updateBAActivities).not.toHaveBeenCalled()
  })

  it('removeActivity retire par id et persiste', async () => {
    const { result } = renderEditor()
    await act(async () => { await result.current.openEditor() })
    await act(async () => { result.current.removeActivity('a1') })
    await waitFor(() => expect(updateBAActivities).toHaveBeenLastCalledWith('pm1', []))
  })

  it('sans module behavioral_activation, openEditor est un no-op', async () => {
    const { result } = renderEditor([])
    await act(async () => { await result.current.openEditor() })
    expect(fetchBAActivities).not.toHaveBeenCalled()
    expect(result.current.open).toBe(false)
  })
})
