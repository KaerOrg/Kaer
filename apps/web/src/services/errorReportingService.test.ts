import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockInvoke = vi.fn()
vi.mock('../lib/supabase', () => ({
  supabase: { functions: { invoke: (...a: unknown[]) => mockInvoke(...a) } },
}))

import { installGlobalErrorHandlers, normalizeRoute, reportAppError, reportFailedOperation } from './errorReportingService'

const INPUT = {
  kind: 'crash' as const,
  message: 'Cannot read property foo of undefined',
  route: '/patient/abc',
  stack: 'TypeError: ...',
  reason: null,
}

beforeEach(() => {
  mockInvoke.mockReset().mockResolvedValue({ error: null })
})

describe('reportAppError (web)', () => {
  it('invoque l\'edge function avec platform=web + app_version', () => {
    reportAppError(INPUT)
    expect(mockInvoke).toHaveBeenCalledTimes(1)
    const [fn, options] = mockInvoke.mock.calls[0]
    expect(fn).toBe('report-app-error')
    expect(options.body).toEqual(expect.objectContaining({ kind: 'crash', message: INPUT.message, platform: 'web' }))
    expect(options.body.app_version).toBeTruthy()
  })

  it('fire-and-forget : un rejet réseau ne propage aucune erreur', () => {
    mockInvoke.mockRejectedValue(new Error('network down'))
    expect(() => reportAppError(INPUT)).not.toThrow()
  })
})

describe('reportFailedOperation (web)', () => {
  it('construit un descriptor kind=failed_operation sans trace', () => {
    reportFailedOperation('/api/patients', 'HTTP 409', 'conflict')
    const [, options] = mockInvoke.mock.calls[0]
    expect(options.body).toEqual(
      expect.objectContaining({ kind: 'failed_operation', message: 'HTTP 409', route: '/api/patients', reason: 'conflict', stack: null }),
    )
  })
})

describe('installGlobalErrorHandlers (web)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('signale une promise rejection non gérée', () => {
    installGlobalErrorHandlers()
    const err = new Error('boom')
    const event = new Event('unhandledrejection') as PromiseRejectionEvent & { reason: unknown }
    Object.defineProperty(event, 'reason', { value: err })
    window.dispatchEvent(event)

    expect(mockInvoke).toHaveBeenCalledTimes(1)
    const [, options] = mockInvoke.mock.calls[0]
    expect(options.body).toEqual(
      expect.objectContaining({ kind: 'crash', message: 'boom', reason: 'unhandled_rejection' }),
    )
  })
})

describe('normalizeRoute', () => {
  it('remplace un segment UUID par :id', () => {
    expect(normalizeRoute('/patient/550e8400-e29b-41d4-a716-446655440000')).toBe('/patient/:id')
  })

  it('laisse une route sans id dynamique inchangée', () => {
    expect(normalizeRoute('/agenda')).toBe('/agenda')
  })

  it('neutralise deux crashs sur des patients différents en une seule signature de route', () => {
    const a = normalizeRoute('/patient/550e8400-e29b-41d4-a716-446655440000')
    const b = normalizeRoute('/patient/6ba7b810-9dad-11d1-80b4-00c04fd430c8')
    expect(a).toBe(b)
  })
})
