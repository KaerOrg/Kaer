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

  it('bornes Y cohérentes pour chaque config déclarée', () => {
    for (const cfg of Object.values(MODULE_EVOLUTION_CONFIG)) {
      expect(cfg.yDomain[0]).toBeLessThan(cfg.yDomain[1])
      expect(cfg.color).toMatch(/^#[0-9A-Fa-f]{6}$/)
    }
  })
})
