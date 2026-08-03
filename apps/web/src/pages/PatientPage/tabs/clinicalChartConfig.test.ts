import { describe, it, expect } from 'vitest'
import { MODULE_EVOLUTION_CONFIG, moduleEvolutionConfig, SCALE_CONFIG } from './clinicalChartConfig'

describe('moduleEvolutionConfig', () => {
  it('rend la config d’un module connu', () => {
    expect(moduleEvolutionConfig('mood_tracker').kind).toBe('fingerprint')
    expect(moduleEvolutionConfig('sleep_diary').cadence).toBe('weekly')
    expect(moduleEvolutionConfig('sleep_diary').unit).toBe('%')
    expect(moduleEvolutionConfig('fear_thermometer').cadence).toBe('per_session')
  })

  it('replie sur une échelle clinique (score brut 0..max) si le module est absent', () => {
    const cfg = moduleEvolutionConfig('phq9')
    expect(cfg.kind).toBe('scale')
    expect(cfg.cadence).toBe('per_passation')
    expect(cfg.yDomain).toEqual([0, SCALE_CONFIG.phq9.yMax])
  })

  it('bornes Y cohérentes pour chaque config qui trace un axe', () => {
    for (const cfg of Object.values(MODULE_EVOLUTION_CONFIG)) {
      // Un module `counts` ne produit aucune série numérique : il n'a pas d'axe Y,
      // et son `yDomain` neutre [0, 0] n'est lu par personne.
      if (cfg.kind !== 'counts') expect(cfg.yDomain[0]).toBeLessThan(cfg.yDomain[1])
      expect(cfg.color).toMatch(/^#[0-9A-Fa-f]{6}$/)
    }
  })

  it('un module « counts » ne déclare aucun axe : le domaine reste neutre', () => {
    const counts = Object.values(MODULE_EVOLUTION_CONFIG).filter(c => c.kind === 'counts')
    expect(counts.length).toBeGreaterThan(0)
    for (const cfg of counts) {
      expect(cfg.yDomain).toEqual([0, 0])
      expect(cfg.unit).toBe('')
    }
  })
})
