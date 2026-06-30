import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockInvoke = vi.fn()
vi.mock('../lib/supabase', () => ({
  supabase: { functions: { invoke: (...a: unknown[]) => mockInvoke(...a) } },
}))

import { reportRenderMismatch } from './renderDiagnosticsService'

const INPUT = {
  level: 'field_type' as const,
  module_id: 'phq9',
  preview_kind: null,
  field_id: 'f1',
  field_type: 'mystery_type',
  widget_type: null,
  reason: 'no component',
}

beforeEach(() => {
  mockInvoke.mockReset().mockResolvedValue({ error: null })
})

describe('reportRenderMismatch (web)', () => {
  it('invoque l\'edge function avec platform=web + app_version', () => {
    reportRenderMismatch(INPUT)
    expect(mockInvoke).toHaveBeenCalledTimes(1)
    const [fn, options] = mockInvoke.mock.calls[0]
    expect(fn).toBe('report-render-mismatch')
    expect(options.body).toEqual(
      expect.objectContaining({ level: 'field_type', module_id: 'phq9', field_type: 'mystery_type', platform: 'web' }),
    )
    expect(options.body.app_version).toBeTruthy()
  })

  it('fire-and-forget : un rejet réseau ne propage aucune erreur', () => {
    mockInvoke.mockRejectedValue(new Error('network down'))
    expect(() => reportRenderMismatch(INPUT)).not.toThrow()
  })
})
