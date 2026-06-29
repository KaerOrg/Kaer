import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ModuleFieldsResult, ContentField } from '@kaer/shared'

vi.mock('../lib/supabase', () => ({
  supabase: { from: vi.fn() },
}))

// Mock partiel : on contrôle le fetch partagé, collectRenderMismatches reste RÉEL.
const mockSharedFetch = vi.fn()
vi.mock('@kaer/shared', async (importActual) => {
  const actual = await importActual<typeof import('@kaer/shared')>()
  return { ...actual, fetchModuleFields: (...a: unknown[]) => mockSharedFetch(...a) }
})

const mockReport = vi.fn()
vi.mock('./renderDiagnosticsService', () => ({ reportRenderMismatch: (...a: unknown[]) => mockReport(...a) }))

import { supabase } from '../lib/supabase'
import { fetchModulePreviewKind, fetchModuleFields } from './moduleService'

// Note : fetchModuleFields est testé dans @kaer/shared (packages/shared/src/services/moduleFields.test.ts)
// car la logique est partagée entre web et mobile via le service injecté.

function makeChain(result: { data: unknown; error?: unknown } = { data: null, error: null }) {
  const chain = new Proxy({} as Record<string, unknown>, {
    get(target, prop: string) {
      if (prop === 'then') return (resolve: (v: unknown) => unknown) => Promise.resolve(result).then(resolve)
      if (!target[prop]) target[prop] = vi.fn().mockReturnValue(chain)
      return target[prop]
    },
  })
  return chain
}

beforeEach(() => vi.clearAllMocks())

describe('moduleService.fetchModulePreviewKind', () => {
  it("renvoie le preview_kind de la table modules", async () => {
    vi.mocked(supabase.from).mockReturnValue(
      makeChain({ data: { preview_kind: 'questionnaire' }, error: null }) as never
    )

    const result = await fetchModulePreviewKind('phq9')

    expect(result).toBe('questionnaire')
  })

  it("retombe sur 'coming_soon' si aucune ligne", async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: null, error: null }) as never)

    const result = await fetchModulePreviewKind('inconnu')

    expect(result).toBe('coming_soon')
  })
})

// #90 — Observabilité à la frontière des données (un seul câblage pour toute l'app).
function field(over: Partial<ContentField> = {}): ContentField {
  return {
    id: 'f1', module_id: 'm', section_id: null, parent_field_id: null,
    field_type: 'card_paragraph', text_code: 'x', sort_order: 0, props: {}, children: [],
    ...over,
  }
}
function makeResult(over: Partial<ModuleFieldsResult> = {}): ModuleFieldsResult {
  return { preview_kind: 'steps', fields: [field()], ...over }
}

describe('moduleService.fetchModuleFields — détection des non-match au chargement', () => {
  it('module sain → aucun signalement', async () => {
    mockSharedFetch.mockResolvedValue(makeResult({ preview_kind: 'steps' }))
    await fetchModuleFields('mod_clean')
    expect(mockReport).not.toHaveBeenCalled()
  })

  it('preview_kind orphelin → signale le non-match', async () => {
    mockSharedFetch.mockResolvedValue(makeResult({ preview_kind: 'mood_tracker', fields: [field({ module_id: 'mod_orphan' })] }))
    await fetchModuleFields('mod_orphan')
    expect(mockReport).toHaveBeenCalledWith(
      expect.objectContaining({ level: 'preview_kind', preview_kind: 'mood_tracker' }),
    )
  })

  it('ne valide qu\'une fois par module (dédup de session)', async () => {
    mockSharedFetch.mockResolvedValue(makeResult({ preview_kind: 'bad_kind', fields: [field({ module_id: 'mod_once' })] }))
    await fetchModuleFields('mod_once')
    await fetchModuleFields('mod_once')
    expect(mockReport).toHaveBeenCalledTimes(1)
  })
})
