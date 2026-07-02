import type { AppError } from '@kaer/shared'
import {
  AppErrorOutboxStore,
  localSignature,
  type SqliteRunner,
} from './appErrorOutbox'

// Faux runner SQLite (jest.fn typés, sans cast) : la sémantique INSERT OR REPLACE /
// UNIQUE est une garantie SQLite (non rejouée ici) — ce test couvre le mapping des
// lignes et les paramètres passés.
function makeRunner(rows: Array<{ id: string; payload: string; created_at: string }> = []): {
  runner: SqliteRunner
  runAsync: jest.Mock
} {
  const runAsync = jest.fn().mockResolvedValue({ lastInsertRowId: 0, changes: 1 })
  const runner: SqliteRunner = {
    execAsync: jest.fn().mockResolvedValue(undefined),
    runAsync,
    getAllAsync: jest.fn().mockResolvedValue(rows),
  }
  return { runner, runAsync }
}

// Aplati les params runAsync, qu'ils soient passés en tableau ou en variadique.
function paramsOf(mock: jest.Mock, callIndex = 0): unknown[] {
  const args = mock.mock.calls[callIndex].slice(1)
  return args.length === 1 && Array.isArray(args[0]) ? args[0] : args
}

const BASE: AppError = {
  platform: 'mobile',
  app_version: '1.0.0',
  kind: 'crash',
  message: 'Cannot read property foo of undefined',
  route: 'ModuleContentScreen',
  stack: 'TypeError: ...',
  reason: null,
}

describe('localSignature', () => {
  it('ignore stack et app_version (même problème = même signature)', () => {
    const a = localSignature({ ...BASE, stack: 'trace A', app_version: '1.0.0' })
    const b = localSignature({ ...BASE, stack: 'trace B', app_version: '9.9.9' })
    expect(a).toBe(b)
  })

  it('distingue deux messages/routes différents', () => {
    expect(localSignature(BASE)).not.toBe(localSignature({ ...BASE, message: 'autre erreur' }))
  })
})

describe('AppErrorOutboxStore', () => {
  it('enqueue passe la signature locale en paramètre (dédup hors-ligne)', async () => {
    const { runner, runAsync } = makeRunner()
    await new AppErrorOutboxStore(runner).enqueue(BASE)
    expect(runAsync).toHaveBeenCalledTimes(1)
    expect(runAsync.mock.calls[0][0]).toContain('INSERT OR REPLACE INTO app_error_outbox')
    const params = paramsOf(runAsync)
    expect(params).toContain(localSignature(BASE))
    // Le payload sérialisé est présent.
    expect(params.some(p => typeof p === 'string' && p.includes('"kind":"crash"'))).toBe(true)
  })

  it('enqueue réutilise l\'id existant pour une signature déjà connue (COALESCE), ne le régénère pas', async () => {
    const { runner, runAsync } = makeRunner()
    await new AppErrorOutboxStore(runner).enqueue(BASE)
    // La requête doit dériver l'id d'un SELECT par signature (id stable), pas
    // uniquement d'un id fraîchement généré — sinon un `markDone(id)` capturé
    // par un flush en cours devient orphelin dès qu'un re-enqueue survient.
    expect(runAsync.mock.calls[0][0]).toMatch(/COALESCE\(\(SELECT id FROM app_error_outbox WHERE signature = \?\)/)
  })

  it('getPending parse le payload JSON en AppError', async () => {
    const { runner } = makeRunner([
      { id: 'r1', payload: JSON.stringify(BASE), created_at: '2026-06-29T10:00:00Z' },
    ])
    const rows = await new AppErrorOutboxStore(runner).getPending()
    expect(rows).toHaveLength(1)
    expect(rows[0].id).toBe('r1')
    expect(rows[0].payload.message).toBe(BASE.message)
    expect(rows[0].payload.kind).toBe('crash')
  })

  it('markDone supprime la ligne par id', async () => {
    const { runner, runAsync } = makeRunner()
    await new AppErrorOutboxStore(runner).markDone('r1')
    expect(runAsync.mock.calls[0][0]).toContain('DELETE FROM app_error_outbox WHERE id = ?')
    expect(paramsOf(runAsync)).toContain('r1')
  })
})
