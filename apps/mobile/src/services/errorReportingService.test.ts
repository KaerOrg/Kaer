import type { AppError } from '@kaer/shared'

// ── Mocks (avant import du service) ──────────────────────────────────────────
const mockEnqueue = jest.fn().mockResolvedValue(undefined)
const mockGetPending = jest.fn().mockResolvedValue([])
const mockMarkDone = jest.fn().mockResolvedValue(undefined)
const mockInvoke = jest.fn().mockResolvedValue({ error: null })

jest.mock('../lib/database', () => ({ getDb: jest.fn(() => ({})) }))
jest.mock('../lib/supabase', () => ({ supabase: { functions: { invoke: (...a: unknown[]) => mockInvoke(...a) } } }))
jest.mock('../lib/appErrorOutbox', () => ({
  getAppErrorOutboxStore: () => ({
    enqueue: (...a: unknown[]) => mockEnqueue(...a),
    getPending: (...a: unknown[]) => mockGetPending(...a),
    markDone: (...a: unknown[]) => mockMarkDone(...a),
  }),
}))

import { flushAppErrorOutbox, installGlobalErrorHandlers, reportAppError, reportFailedOperation } from './errorReportingService'

const INPUT = {
  kind: 'crash' as const,
  message: 'Cannot read property foo of undefined',
  route: 'ModuleContentScreen',
  stack: 'TypeError: ...',
  reason: null,
}

function makeRow(id: string): { id: string; payload: AppError; created_at: string } {
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

describe('reportAppError (mobile)', () => {
  it('persiste dans la file avec platform=mobile + app_version', async () => {
    await reportAppError(INPUT)
    expect(mockEnqueue).toHaveBeenCalledTimes(1)
    expect(mockEnqueue).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'crash', message: INPUT.message, platform: 'mobile' }),
    )
    expect(mockEnqueue.mock.calls[0][0].app_version).toBeTruthy()
  })
})

describe('reportFailedOperation (mobile)', () => {
  it('construit un descriptor kind=failed_operation sans trace', async () => {
    reportFailedOperation('ModuleContentScreen', 'HTTP 409', 'conflict')
    await Promise.resolve()
    expect(mockEnqueue).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'failed_operation', message: 'HTTP 409', route: 'ModuleContentScreen', reason: 'conflict', stack: null }),
    )
  })
})

describe('flushAppErrorOutbox', () => {
  it('envoie chaque entrée puis la marque traitée', async () => {
    mockGetPending.mockResolvedValueOnce([makeRow('a'), makeRow('b')])
    await flushAppErrorOutbox()
    expect(mockInvoke).toHaveBeenCalledTimes(2)
    expect(mockInvoke).toHaveBeenCalledWith('report-app-error', expect.objectContaining({ body: expect.any(Object) }))
    expect(mockMarkDone).toHaveBeenCalledWith('a')
    expect(mockMarkDone).toHaveBeenCalledWith('b')
  })

  it('hors-ligne : au 1ᵉʳ échec réseau, conserve la file (pas de markDone)', async () => {
    mockGetPending.mockResolvedValueOnce([makeRow('a'), makeRow('b')])
    mockInvoke.mockResolvedValueOnce({ error: { message: 'network' } })
    await flushAppErrorOutbox()
    expect(mockInvoke).toHaveBeenCalledTimes(1)
    expect(mockMarkDone).not.toHaveBeenCalled()
  })

  it('file vide : aucun envoi', async () => {
    await flushAppErrorOutbox()
    expect(mockInvoke).not.toHaveBeenCalled()
  })
})

describe('installGlobalErrorHandlers (mobile)', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('persiste le crash AVANT de rendre la main au handler précédent (crash fatal)', async () => {
    const previousHandler = jest.fn()
    const setGlobalHandlerSpy = jest.spyOn(ErrorUtils, 'setGlobalHandler')
    jest.spyOn(ErrorUtils, 'getGlobalHandler').mockReturnValue(previousHandler)

    installGlobalErrorHandlers()
    const installedHandler = setGlobalHandlerSpy.mock.calls[0][0]
    const err = new Error('crash fatal')
    installedHandler(err, true)
    // previousHandler ne doit pas encore avoir été appelé de façon synchrone :
    // reportAppError (SQLite enqueue) doit se terminer d'abord.
    expect(previousHandler).not.toHaveBeenCalled()
    await Promise.resolve()
    await Promise.resolve()

    expect(mockEnqueue).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'crash', message: 'crash fatal', reason: 'fatal' }),
    )
    expect(previousHandler).toHaveBeenCalledWith(err, true)
  })
})
