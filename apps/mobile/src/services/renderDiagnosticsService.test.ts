import type { RenderMismatch } from '@kaer/shared'

// ── Mocks (avant import du service) ──────────────────────────────────────────
const mockEnqueue = jest.fn().mockResolvedValue(undefined)
const mockGetPending = jest.fn().mockResolvedValue([])
const mockMarkDone = jest.fn().mockResolvedValue(undefined)
const mockInvoke = jest.fn().mockResolvedValue({ error: null })

jest.mock('../lib/database', () => ({ getDb: jest.fn(() => ({})) }))
jest.mock('../lib/supabase', () => ({ supabase: { functions: { invoke: (...a: unknown[]) => mockInvoke(...a) } } }))
jest.mock('../lib/renderMismatchOutbox', () => ({
  getRenderMismatchOutboxStore: () => ({
    enqueue: (...a: unknown[]) => mockEnqueue(...a),
    getPending: (...a: unknown[]) => mockGetPending(...a),
    markDone: (...a: unknown[]) => mockMarkDone(...a),
  }),
}))

import { reportRenderMismatch, flushRenderMismatchOutbox } from './renderDiagnosticsService'

const INPUT = {
  level: 'preview_kind' as const,
  module_id: 'mood_tracker',
  preview_kind: 'unknown_kind',
  field_id: null,
  field_type: null,
  widget_type: null,
  reason: 'no layout',
}

function makeRow(id: string): { id: string; payload: RenderMismatch; created_at: string } {
  return {
    id,
    payload: { ...INPUT, platform: 'mobile', app_version: '1.0.0' },
    created_at: '2026-06-29T10:00:00Z',
  }
}

beforeEach(() => {
  mockEnqueue.mockClear()
  mockGetPending.mockClear().mockResolvedValue([])
  mockMarkDone.mockClear()
  mockInvoke.mockClear().mockResolvedValue({ error: null })
})

describe('reportRenderMismatch (mobile)', () => {
  it('persiste dans la file avec platform=mobile + app_version', async () => {
    await reportRenderMismatch(INPUT)
    expect(mockEnqueue).toHaveBeenCalledTimes(1)
    expect(mockEnqueue).toHaveBeenCalledWith(
      expect.objectContaining({ level: 'preview_kind', module_id: 'mood_tracker', platform: 'mobile' }),
    )
    expect(mockEnqueue.mock.calls[0][0].app_version).toBeTruthy()
  })
})

describe('flushRenderMismatchOutbox', () => {
  it('envoie chaque entrée puis la marque traitée', async () => {
    mockGetPending.mockResolvedValueOnce([makeRow('a'), makeRow('b')])
    await flushRenderMismatchOutbox()
    expect(mockInvoke).toHaveBeenCalledTimes(2)
    expect(mockInvoke).toHaveBeenCalledWith('report-render-mismatch', expect.objectContaining({ body: expect.any(Object) }))
    expect(mockMarkDone).toHaveBeenCalledWith('a')
    expect(mockMarkDone).toHaveBeenCalledWith('b')
  })

  it('hors-ligne : au 1ᵉʳ échec réseau, conserve la file (pas de markDone)', async () => {
    mockGetPending.mockResolvedValueOnce([makeRow('a'), makeRow('b')])
    mockInvoke.mockResolvedValueOnce({ error: { message: 'network' } })
    await flushRenderMismatchOutbox()
    expect(mockInvoke).toHaveBeenCalledTimes(1)
    expect(mockMarkDone).not.toHaveBeenCalled()
  })

  it('file vide : aucun envoi', async () => {
    await flushRenderMismatchOutbox()
    expect(mockInvoke).not.toHaveBeenCalled()
  })
})
