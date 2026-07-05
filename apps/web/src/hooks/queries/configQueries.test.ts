import { describe, it, expect } from 'vitest'

vi.mock('@services/moduleService', () => ({ fetchModuleFields: vi.fn() }))
vi.mock('@services/scaleService', () => ({ fetchScaleMeta: vi.fn() }))
vi.mock('@services/moduleSourcesService', () => ({ fetchSourcesByModule: vi.fn() }))
vi.mock('@services/psyeduService', () => ({
  fetchLibraryTopics: vi.fn(),
  fetchThemes: vi.fn(),
  fetchTopicsByModule: vi.fn(),
  fetchBlocksByTopic: vi.fn(),
}))
vi.mock('@services/moduleCatalogService', () => ({
  fetchModuleCategories: vi.fn(),
  fetchComingSoonModuleIds: vi.fn(),
}))
vi.mock('@services/practitionerSettingsService', () => ({
  fetchEnabledModules: vi.fn(),
  saveEnabledModules: vi.fn(),
}))
vi.mock('@services/authService', () => ({ fetchProfessionalTitles: vi.fn() }))

import { CONFIG_QUERY_OPTIONS } from './configCache'
import { moduleQueries } from './moduleQueries'
import { scaleQueries } from './scaleQueries'
import { moduleSourcesQueries } from './moduleSourcesQueries'
import { psyeduQueries } from './psyeduQueries'
import { referenceQueries } from './referenceQueries'
import { catalogQueries } from './catalogQueries'

describe('CONFIG_QUERY_OPTIONS', () => {
  it('décrit un cache infini marqué configScoped', () => {
    expect(CONFIG_QUERY_OPTIONS.staleTime).toBe(Infinity)
    expect(CONFIG_QUERY_OPTIONS.gcTime).toBe(Infinity)
    expect(CONFIG_QUERY_OPTIONS.meta).toEqual({ configScoped: true })
  })
})

describe('factories de config — clés canoniques', () => {
  it('produit des clés stables et distinctes', () => {
    expect(moduleQueries.fields('phq9').queryKey).toEqual(['module', 'fields', 'phq9'])
    expect(scaleQueries.meta().queryKey).toEqual(['scale', 'meta'])
    expect(moduleSourcesQueries.byModule('gad7').queryKey).toEqual(['moduleSources', 'byModule', 'gad7'])
    expect(psyeduQueries.topicsByModule('sleep').queryKey).toEqual(['psyedu', 'topicsByModule', 'sleep'])
    expect(psyeduQueries.blocksByTopic('t1').queryKey).toEqual(['psyedu', 'blocksByTopic', 't1'])
  })
})

describe('factories de config — cache infini + invalidation par jeton', () => {
  it('toutes les queries de config portent staleTime Infinity + meta.configScoped', () => {
    const configured = [
      moduleQueries.fields('phq9'),
      scaleQueries.meta(),
      moduleSourcesQueries.byModule('gad7'),
      psyeduQueries.libraryTopics(),
      psyeduQueries.themes(),
      psyeduQueries.topicsByModule('sleep'),
      psyeduQueries.blocksByTopic('t1'),
      referenceQueries.professionalTitles(),
      catalogQueries.categories(),
      catalogQueries.comingSoonIds(),
      catalogQueries.previewKind('phq9'),
    ]
    for (const q of configured) {
      expect(q.staleTime).toBe(Infinity)
      expect(q.gcTime).toBe(Infinity)
      expect(q.meta).toEqual({ configScoped: true })
    }
  })

  it('enabledModules dépend du praticien — PAS configScoped (invalidation sur écriture)', () => {
    const q = catalogQueries.enabledModules('prac-1')
    expect(q.meta).toBeUndefined()
    expect(q.staleTime).not.toBe(Infinity)
  })

  it('topicsByModule est désactivée sans moduleKey', () => {
    expect(psyeduQueries.topicsByModule('').enabled).toBe(false)
    expect(psyeduQueries.topicsByModule('sleep').enabled).toBe(true)
  })
})
