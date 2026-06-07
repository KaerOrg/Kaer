import type { FearEntry, FearSituation } from '../../../../../lib/database'
import {
  sortSteps, entriesForStep, sessionCount, sessionScore, peakSeries,
  lastSessionScore, buildSudsSteps, serializeStrategies, deserializeStrategies,
} from './exposureLogic'

function step(overrides: Partial<FearSituation>): FearSituation {
  return {
    id: 's', label: 'l', hierarchy_id: null, target_suds: null, is_done: 0,
    created_at: '2026-01-01T00:00:00Z', ...overrides,
  }
}

function entry(overrides: Partial<FearEntry>): FearEntry {
  return {
    id: 'e', date: '2026-01-01', situation_id: 's1', situation_label: 'l',
    suds_before: 50, suds_peak: null, strategies: '{"selected":[],"custom":""}',
    custom_strategy: null, suds_after: null, expectation_text: null,
    outcome_text: null, notes: null, created_at: '2026-01-01T00:00:00Z', ...overrides,
  }
}

describe('exposureLogic', () => {
  describe('sortSteps', () => {
    it('classe par target_suds croissant', () => {
      const sorted = sortSteps([
        step({ id: 'a', target_suds: 80 }),
        step({ id: 'b', target_suds: 20 }),
        step({ id: 'c', target_suds: 50 }),
      ])
      expect(sorted.map(s => s.id)).toEqual(['b', 'c', 'a'])
    })

    it('place les marches sans cible en dernier, départage par created_at', () => {
      const sorted = sortSteps([
        step({ id: 'a', target_suds: null, created_at: '2026-02-01T00:00:00Z' }),
        step({ id: 'b', target_suds: null, created_at: '2026-01-01T00:00:00Z' }),
        step({ id: 'c', target_suds: 10 }),
      ])
      expect(sorted.map(s => s.id)).toEqual(['c', 'b', 'a'])
    })
  })

  describe('sessionScore', () => {
    it('priorise le pic', () => {
      expect(sessionScore(entry({ suds_before: 40, suds_peak: 90, suds_after: 20 }))).toBe(90)
    })
    it('replie sur le final si pas de pic', () => {
      expect(sessionScore(entry({ suds_before: 40, suds_peak: null, suds_after: 20 }))).toBe(20)
    })
    it('replie sur le début si ni pic ni final', () => {
      expect(sessionScore(entry({ suds_before: 40, suds_peak: null, suds_after: null }))).toBe(40)
    })
  })

  describe('peakSeries / lastSessionScore', () => {
    const entries = [
      entry({ id: 'e2', situation_id: 's1', date: '2026-03-02', suds_peak: 60 }),
      entry({ id: 'e1', situation_id: 's1', date: '2026-03-01', suds_peak: 80 }),
      entry({ id: 'e3', situation_id: 's2', date: '2026-03-03', suds_peak: 10 }),
    ]
    it('filtre par marche et trie par date croissante', () => {
      expect(peakSeries(entries, 's1')).toEqual([
        { score: 80, date: '2026-03-01' },
        { score: 60, date: '2026-03-02' },
      ])
    })
    it('lastSessionScore = dernière séance', () => {
      expect(lastSessionScore(entries, 's1')).toBe(60)
      expect(lastSessionScore(entries, 'inconnu')).toBeNull()
    })
    it('sessionCount compte les séances de la marche', () => {
      expect(sessionCount(entries, 's1')).toBe(2)
      expect(entriesForStep(entries, 's2')).toHaveLength(1)
    })
  })

  describe('buildSudsSteps', () => {
    it('génère les paliers inclusifs', () => {
      expect(buildSudsSteps(0, 100, 10)).toEqual([0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100])
    })
  })

  describe('serialize / deserialize strategies', () => {
    it('aller-retour conserve sélection et texte libre', () => {
      const raw = serializeStrategies(['a', 'b'], 'respirer')
      expect(deserializeStrategies(raw)).toEqual({ selected: ['a', 'b'], custom: 'respirer' })
    })
    it('JSON invalide → valeurs vides', () => {
      expect(deserializeStrategies('pas du json')).toEqual({ selected: [], custom: '' })
    })
  })
})
