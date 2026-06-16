import { computeSleepEfficiency, sleepEfficiencyLabel, minutesBetween } from './database'

// ─── computeSleepEfficiency ───────────────────────────────────────────────────

describe('computeSleepEfficiency', () => {
  // Scénario 1 — Sommeil parfait (100 %)
  // Coucher 23h, lever 7h → TPL = 480 min, endormissement 0, réveils 0
  // SE = 480 / 480 = 100 %
  it('retourne 100 % pour un sommeil parfait sans latence ni réveil', () => {
    expect(computeSleepEfficiency('23:00', '07:00', 0, 0)).toBe(100)
  })

  // Scénario 2 — Sommeil moyen (~80 %)
  // Coucher 23h, lever 7h → TPL = 480 min
  // Endormissement 30 min + réveils 66 min → TST = 384 min
  // SE = 384 / 480 = 80 %
  it('retourne 80 % pour un sommeil moyen (30 min latence + 66 min réveils)', () => {
    expect(computeSleepEfficiency('23:00', '07:00', 30, 66)).toBe(80)
  })

  // Scénario 3 — Sommeil médiocre (<70 %)
  // Coucher 23h, lever 7h → TPL = 480 min
  // Endormissement 60 min + réveils 90 min → TST = 330 min
  // SE = 330 / 480 ≈ 68 %
  it('retourne moins de 70 % pour un sommeil médiocre (60 min latence + 90 min réveils)', () => {
    const se = computeSleepEfficiency('23:00', '07:00', 60, 90)
    expect(se).not.toBeNull()
    expect(se!).toBeLessThan(70)
    expect(se!).toBe(69) // 330 / 480 * 100 = 68.75 → arrondi à 69
  })

  // Scénario 4 — Passage minuit
  // Coucher 00h30, lever 06h30 → TPL = 360 min
  // Endormissement 20 min → TST = 340 min
  // SE = 340 / 360 ≈ 94 %
  it('gère correctement le passage à minuit', () => {
    expect(computeSleepEfficiency('00:30', '06:30', 20, 0)).toBe(94)
  })

  // Scénario 5 — Cas limite : TST négatif → SE = 0 (pas de valeur négative)
  it('retourne 0 si la latence + réveils dépassent le temps passé au lit', () => {
    expect(computeSleepEfficiency('23:00', '07:00', 300, 300)).toBe(0)
  })

  // Scénario 6 — Données invalides (horaires identiques) → null
  it('retourne null si TPL est nul ou négatif', () => {
    expect(computeSleepEfficiency('07:00', '07:00', 0, 0)).toBeNull()
  })

  // Scénario 7 — TPL précis Consensus Sleep Diary (mise au lit → sortie du lit)
  // Essai de dormir 23h, dernier réveil 07h → fenêtre 480 min, TST = 480.
  // Mise au lit 22h30, sortie du lit 07h30 → TPL = 540 min.
  // SE = 480 / 540 ≈ 89 %
  it('utilise le TPL précis (mise au lit → sortie du lit) quand fourni', () => {
    expect(computeSleepEfficiency('23:00', '07:00', 0, 0, '22:30', '07:30')).toBe(89)
  })

  // Scénario 8 — Sans horaires CSD précis, le TPL retombe sur la fenêtre de sommeil
  // (rétro-compatibilité de l'ancien modèle) → 100 %.
  it('retombe sur la fenêtre de sommeil si les horaires précis manquent', () => {
    expect(computeSleepEfficiency('23:00', '07:00', 0, 0)).toBe(100)
    expect(computeSleepEfficiency('23:00', '07:00', 0, 0, null, null)).toBe(100)
  })
})

// ─── minutesBetween ───────────────────────────────────────────────────────────

describe('minutesBetween', () => {
  it('calcule la durée entre deux horaires le même jour', () => {
    expect(minutesBetween('22:30', '23:00')).toBe(30)
  })

  it('gère le passage à minuit', () => {
    expect(minutesBetween('23:00', '07:00')).toBe(480)
  })

  it('retourne null si un horaire est mal formé', () => {
    expect(minutesBetween('aa:bb', '07:00')).toBeNull()
  })
})

// ─── sleepEfficiencyLabel ─────────────────────────────────────────────────────

describe('sleepEfficiencyLabel', () => {
  it('classe 85 % et plus comme "bon"', () => {
    expect(sleepEfficiencyLabel(85)).toBe('bon')
    expect(sleepEfficiencyLabel(100)).toBe('bon')
  })

  it('classe 70 à 84 % comme "moyen"', () => {
    expect(sleepEfficiencyLabel(70)).toBe('moyen')
    expect(sleepEfficiencyLabel(84)).toBe('moyen')
  })

  it('classe moins de 70 % comme "insuffisant"', () => {
    expect(sleepEfficiencyLabel(69)).toBe('insuffisant')
    expect(sleepEfficiencyLabel(0)).toBe('insuffisant')
  })
})
