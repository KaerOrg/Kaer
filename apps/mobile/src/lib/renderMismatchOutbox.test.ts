import type { RenderMismatch } from '@kaer/shared'
import {
  RenderMismatchOutboxStore,
  localSignature,
  type SqliteRunner,
} from './renderMismatchOutbox'

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

const BASE: RenderMismatch = {
  platform: 'mobile',
  app_version: '1.0.0',
  level: 'preview_kind',
  module_id: 'mood_tracker',
  preview_kind: 'unknown_kind',
  field_id: null,
  field_type: null,
  widget_type: null,
  reason: 'no layout',
}

describe('localSignature', () => {
  it('ignore field_id et app_version (même problème = même signature)', () => {
    const a = localSignature({ ...BASE, field_id: 'x', app_version: '1.0.0' })
    const b = localSignature({ ...BASE, field_id: 'y', app_version: '9.9.9' })
    expect(a).toBe(b)
  })

  it('distingue deux niveaux/raisons', () => {
    expect(localSignature(BASE)).not.toBe(localSignature({ ...BASE, reason: 'autre' }))
  })
})

describe('RenderMismatchOutboxStore', () => {
  it('enqueue passe la signature locale en paramètre (dédup hors-ligne)', async () => {
    const { runner, runAsync } = makeRunner()
    await new RenderMismatchOutboxStore(runner).enqueue(BASE)
    expect(runAsync).toHaveBeenCalledTimes(1)
    expect(runAsync.mock.calls[0][0]).toContain('INSERT OR REPLACE INTO render_mismatch_outbox')
    const params = paramsOf(runAsync)
    expect(params).toContain(localSignature(BASE))
    // Le payload sérialisé est présent.
    expect(params.some(p => typeof p === 'string' && p.includes('"module_id":"mood_tracker"'))).toBe(true)
  })

  it('getPending parse le payload JSON en RenderMismatch', async () => {
    const { runner } = makeRunner([
      { id: 'r1', payload: JSON.stringify(BASE), created_at: '2026-06-29T10:00:00Z' },
    ])
    const rows = await new RenderMismatchOutboxStore(runner).getPending()
    expect(rows).toHaveLength(1)
    expect(rows[0].id).toBe('r1')
    expect(rows[0].payload.module_id).toBe('mood_tracker')
    expect(rows[0].payload.level).toBe('preview_kind')
  })

  it('markDone supprime la ligne par id', async () => {
    const { runner, runAsync } = makeRunner()
    await new RenderMismatchOutboxStore(runner).markDone('r1')
    expect(runAsync.mock.calls[0][0]).toContain('DELETE FROM render_mismatch_outbox WHERE id = ?')
    expect(paramsOf(runAsync)).toContain('r1')
  })
})
