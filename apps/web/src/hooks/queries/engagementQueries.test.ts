import { describe, it, expect } from 'vitest'

vi.mock('@services/engagementService', () => ({
  fetchScaleEvolution: vi.fn(), fetchMoodEvolution: vi.fn(), fetchFearEvolution: vi.fn(),
  fetchMedSideEffectsEvolution: vi.fn(), fetchSleepEvolution: vi.fn(),
  fetchAvailableScales: vi.fn(), fetchModuleSummary: vi.fn(), fetchChronoEntries: vi.fn(),
  fetchFormEntries: vi.fn(),
}))

import { engagementQueries } from './engagementQueries'

describe('engagementQueries', () => {
  it('produit des clés canoniques par patient', () => {
    expect(engagementQueries.patientEvolution('pt1').queryKey).toEqual(['engagement', 'evolution', 'pt1'])
    expect(engagementQueries.moduleData('pt1', 'phq9', 'scale').queryKey).toEqual([
      'engagement', 'moduleData', 'pt1', 'phq9',
    ])
  })

  it('patientDataKeys renvoie les préfixes à invalider pour un patient (Realtime #103)', () => {
    expect(engagementQueries.patientDataKeys('pt1')).toEqual([
      ['engagement', 'evolution', 'pt1'],
      ['engagement', 'moduleData', 'pt1'],
    ])
  })
})
