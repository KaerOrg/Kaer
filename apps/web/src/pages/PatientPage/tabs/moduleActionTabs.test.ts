import { describe, it, expect } from 'vitest'
import { computeModuleTabs } from './moduleActionTabs'

const locked = { unlocked: false, isScale: false, scaleHasPreview: false }
const unlocked = { ...locked, unlocked: true }

// Ordre canonique : Données → Configuration → Notifications → Sources → Vue patient.
describe('computeModuleTabs', () => {
  it('module générique déverrouillé : données + notifications + sources + vue patient', () => {
    expect(computeModuleTabs('mood_tracker', unlocked)).toEqual(['data', 'notifications', 'sources', 'preview'])
  })

  it('module générique verrouillé : sources + vue patient seuls', () => {
    expect(computeModuleTabs('mood_tracker', locked)).toEqual(['sources', 'preview'])
  })

  it('échelle avec aperçu déverrouillée : données + sources + vue patient, jamais de notifications', () => {
    const ctx = { unlocked: true, isScale: true, scaleHasPreview: true }
    expect(computeModuleTabs('phq9', ctx)).toEqual(['data', 'sources', 'preview'])
  })

  it('échelle sans aperçu : données seule', () => {
    const ctx = { unlocked: true, isScale: true, scaleHasPreview: false }
    expect(computeModuleTabs('phq9', ctx)).toEqual(['data'])
  })

  it('psychoéducation : config + sources + vue patient (config disponible même verrouillé)', () => {
    expect(computeModuleTabs('psychoeducation', unlocked)).toEqual(['config', 'sources', 'preview'])
    expect(computeModuleTabs('psychoeducation', locked)).toEqual(['config', 'sources', 'preview'])
  })

  it('plan de crise : config + sources + vue patient une fois déverrouillé, rien verrouillé', () => {
    expect(computeModuleTabs('crisis_plan', locked)).toEqual([])
    expect(computeModuleTabs('crisis_plan', unlocked)).toEqual(['config', 'sources', 'preview'])
  })

  it('rim : uniquement config (le formulaire crée le module), verrouillé comme déverrouillé', () => {
    expect(computeModuleTabs('rim', unlocked)).toEqual(['config'])
    expect(computeModuleTabs('rim', locked)).toEqual(['config'])
  })

  it('familles à aperçu conditionnel (médication) : ordre complet une fois déverrouillé', () => {
    expect(computeModuleTabs('medication_side_effects', locked)).toEqual([])
    expect(computeModuleTabs('medication_side_effects', unlocked)).toEqual(['data', 'config', 'notifications', 'sources', 'preview'])
  })
})
