import { describe, it, expect } from 'vitest'
import { computeModuleTabs } from './moduleActionTabs'

const locked = { unlocked: false, isScale: false, scaleHasPreview: false }
const unlocked = { ...locked, unlocked: true }

// Ordre canonique : Données → Configuration → Notifications → Vue patient → Sources.
describe('computeModuleTabs', () => {
  it('module générique déverrouillé : données + notifications + vue patient + sources', () => {
    expect(computeModuleTabs('mood_tracker', unlocked)).toEqual(['data', 'notifications', 'preview', 'sources'])
  })

  it('module générique verrouillé : vue patient + sources seuls', () => {
    expect(computeModuleTabs('mood_tracker', locked)).toEqual(['preview', 'sources'])
  })

  it('échelle avec aperçu déverrouillée : données + vue patient + sources, jamais de notifications', () => {
    const ctx = { unlocked: true, isScale: true, scaleHasPreview: true }
    expect(computeModuleTabs('phq9', ctx)).toEqual(['data', 'preview', 'sources'])
  })

  it('échelle sans aperçu : données seule', () => {
    const ctx = { unlocked: true, isScale: true, scaleHasPreview: false }
    expect(computeModuleTabs('phq9', ctx)).toEqual(['data'])
  })

  it('psychoéducation : config + vue patient + sources (config disponible même verrouillé)', () => {
    expect(computeModuleTabs('psychoeducation', unlocked)).toEqual(['config', 'preview', 'sources'])
    expect(computeModuleTabs('psychoeducation', locked)).toEqual(['config', 'preview', 'sources'])
  })

  it('plan de crise : config + vue patient + sources une fois déverrouillé, rien verrouillé', () => {
    expect(computeModuleTabs('crisis_plan', locked)).toEqual([])
    expect(computeModuleTabs('crisis_plan', unlocked)).toEqual(['config', 'preview', 'sources'])
  })

  it('rim : uniquement config (le formulaire crée le module), verrouillé comme déverrouillé', () => {
    expect(computeModuleTabs('rim', unlocked)).toEqual(['config'])
    expect(computeModuleTabs('rim', locked)).toEqual(['config'])
  })

  it('familles à aperçu conditionnel (médication) : ordre complet une fois déverrouillé', () => {
    expect(computeModuleTabs('medication_side_effects', locked)).toEqual([])
    expect(computeModuleTabs('medication_side_effects', unlocked)).toEqual(['data', 'config', 'notifications', 'preview', 'sources'])
  })

  it('cognitive_saturation (défusion) : ordre canonique complet une fois déverrouillé', () => {
    expect(computeModuleTabs('cognitive_saturation', unlocked)).toEqual(['data', 'config', 'notifications', 'preview', 'sources'])
    // Verrouillé : aperçu + sources (l'aperçu ne requiert pas le déblocage).
    expect(computeModuleTabs('cognitive_saturation', locked)).toEqual(['preview', 'sources'])
  })
})
