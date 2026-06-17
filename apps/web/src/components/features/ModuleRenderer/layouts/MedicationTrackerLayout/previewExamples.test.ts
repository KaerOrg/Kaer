import { describe, it, expect } from 'vitest'
import { buildExampleMeds, buildCalendarStatusByDay } from './previewExamples'

const t = (k: string) => k
const lbl = (k: string) => `lbl.${k}`

describe('buildExampleMeds', () => {
  it('renvoie trois molécules dont une PRN, libellés issus de l\'i18n', () => {
    const meds = buildExampleMeds('medication_adherence', t, lbl)
    expect(meds).toHaveLength(3)
    expect(meds[0].name).toBe('modules.medication_adherence.preview_med1_name')
    expect(meds[0].poso).toBe('modules.medication_adherence.preview_med1_poso')
    expect(meds[0].kindLabel).toBe('lbl.med_kind_maintenance')
    expect(meds[0].prn).toBe(false)
    expect(meds[2].kindLabel).toBe('lbl.med_kind_prn')
    expect(meds[2].prn).toBe(true)
  })

  it('dérive les clés du moduleId fourni', () => {
    const meds = buildExampleMeds('autre_module', t, lbl)
    expect(meds[1].name).toBe('modules.autre_module.preview_med2_name')
  })
})

describe('buildCalendarStatusByDay', () => {
  it('renvoie un objet vide si aucun statut disponible', () => {
    expect(buildCalendarStatusByDay(15, 0)).toEqual({})
  })

  it('couvre tous les jours de 1 à todayDate inclus', () => {
    const out = buildCalendarStatusByDay(10, 3)
    expect(Object.keys(out)).toHaveLength(10)
    expect(out[1]).toBeDefined()
    expect(out[10]).toBeDefined()
    expect(out[11]).toBeUndefined()
  })

  it('est déterministe et borne l\'index au nombre de statuts disponibles', () => {
    const out = buildCalendarStatusByDay(31, 3)
    // Chaque index reste dans [0, statusCount - 1]
    for (const idx of Object.values(out)) {
      expect(idx).toBeGreaterThanOrEqual(0)
      expect(idx).toBeLessThanOrEqual(2)
    }
    // Reproductible
    expect(buildCalendarStatusByDay(31, 3)).toEqual(out)
  })

  it('clampe l\'index quand un seul statut est disponible', () => {
    const out = buildCalendarStatusByDay(31, 1)
    for (const idx of Object.values(out)) {
      expect(idx).toBe(0)
    }
  })
})
