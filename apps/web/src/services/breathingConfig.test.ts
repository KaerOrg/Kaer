import { describe, it, expect } from 'vitest'
import { breathingConfigFromModuleConfig } from './moduleAssignmentService'

describe('breathingConfigFromModuleConfig', () => {
  it('lit l’activation, la technique de séance et l’objectif', () => {
    expect(breathingConfigFromModuleConfig({
      enabled_techniques: ['coherence_cardiaque', 'carree'],
      primary_technique: 'coherence_cardiaque',
      weekly_goal_sessions: 5,
    })).toEqual({
      enabledTechniques: ['coherence_cardiaque', 'carree'],
      primaryTechnique: 'coherence_cardiaque',
      weeklyGoalSessions: 5,
    })
  })

  it('rend une config vide pour un module jamais configuré', () => {
    expect(breathingConfigFromModuleConfig(null)).toEqual({
      enabledTechniques: [], primaryTechnique: null, weeklyGoalSessions: null,
    })
  })

  it('ignore une config d’un autre module sans planter', () => {
    expect(breathingConfigFromModuleConfig({ medications: [{ id: 'a' }] })).toEqual({
      enabledTechniques: [], primaryTechnique: null, weeklyGoalSessions: null,
    })
  })

  it('écarte les clés de technique non textuelles', () => {
    const config = breathingConfigFromModuleConfig({ enabled_techniques: ['ok', 42, null] })
    expect(config.enabledTechniques).toEqual(['ok'])
  })

  it('écarte un objectif non numérique', () => {
    expect(breathingConfigFromModuleConfig({ weekly_goal_sessions: '5' }).weeklyGoalSessions).toBeNull()
    expect(breathingConfigFromModuleConfig({ weekly_goal_sessions: NaN }).weeklyGoalSessions).toBeNull()
  })

  it('écarte une technique de séance non textuelle', () => {
    expect(breathingConfigFromModuleConfig({ primary_technique: 3 }).primaryTechnique).toBeNull()
  })
})
