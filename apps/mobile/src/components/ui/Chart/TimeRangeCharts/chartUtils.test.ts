import {
  buildXLabels,
  buildChartData,
  buildTotalScoreChartData,
  computeAvg,
  computeStreak,
  buildCompositeData,
  markerXFraction,
} from './chartUtils'

// Date fixe pour tous les tests
const TODAY = new Date('2026-06-03T12:00:00.000Z')

beforeEach(() => {
  jest.useFakeTimers()
  jest.setSystemTime(TODAY)
})

afterEach(() => {
  jest.useRealTimers()
})

function makeEntry(
  daysAgo: number,
  totalScore: number,
  subscales?: Record<string, number>,
) {
  const d = new Date(TODAY)
  d.setUTCDate(d.getUTCDate() - daysAgo)
  return {
    id: `entry-${daysAgo}`,
    scale_id: 'test',
    answers: [],
    total_score: totalScore,
    subscale_scores: subscales ?? null,
    created_at: d.toISOString(),
  }
}

// ── computeAvg ────────────────────────────────────────────────────────────────

describe('computeAvg', () => {
  it('retourne — si aucun point', () => {
    expect(computeAvg([])).toBe('—')
  })

  it('retourne — si tous les points sont invalides', () => {
    const points = [
      { value: 0, hasValue: false },
      { value: 5, hasValue: false },
    ]
    expect(computeAvg(points)).toBe('—')
  })

  it('retourne la valeur formatée à 1 décimale pour un point valide', () => {
    expect(computeAvg([{ value: 7, hasValue: true }])).toBe('7.0')
  })

  it('calcule la moyenne des points valides uniquement', () => {
    const points = [
      { value: 4, hasValue: true },
      { value: 0, hasValue: false },
      { value: 6, hasValue: true },
    ]
    expect(computeAvg(points)).toBe('5.0')
  })
})

// ── computeStreak ─────────────────────────────────────────────────────────────

describe('computeStreak', () => {
  it('retourne 0 si aucune entrée', () => {
    expect(computeStreak([])).toBe(0)
  })

  it("retourne 0 si aucune entrée aujourd'hui", () => {
    expect(computeStreak([makeEntry(1, 5), makeEntry(2, 5)])).toBe(0)
  })

  it("retourne 1 si entrée uniquement aujourd'hui", () => {
    expect(computeStreak([makeEntry(0, 5)])).toBe(1)
  })

  it("compte les jours consécutifs depuis aujourd'hui", () => {
    const entries = [makeEntry(0, 5), makeEntry(1, 5), makeEntry(2, 5)]
    expect(computeStreak(entries)).toBe(3)
  })

  it("s'arrête au premier jour manquant", () => {
    // gap au jour 1
    const entries = [makeEntry(0, 5), makeEntry(2, 5)]
    expect(computeStreak(entries)).toBe(1)
  })
})

// ── buildChartData ────────────────────────────────────────────────────────────

describe('buildChartData — 7J', () => {
  it('produit 7 points', () => {
    expect(buildChartData([], 'humeur', '7J')).toHaveLength(7)
  })

  it('tous invalides sans entrées', () => {
    const points = buildChartData([], 'humeur', '7J')
    expect(points.every(p => !p.hasValue)).toBe(true)
  })

  it("place l'entrée d'aujourd'hui au dernier index", () => {
    const entry = makeEntry(0, 5, { humeur: 8 })
    const points = buildChartData([entry], 'humeur', '7J')
    expect(points[6]).toEqual({ value: 8, hasValue: true })
  })

  it("place l'entrée il y a 6 jours au premier index", () => {
    const entry = makeEntry(6, 5, { humeur: 3 })
    const points = buildChartData([entry], 'humeur', '7J')
    expect(points[0]).toEqual({ value: 3, hasValue: true })
  })

  it('retourne hasValue:false pour les jours sans entrée', () => {
    const entry = makeEntry(0, 5, { humeur: 7 })
    const points = buildChartData([entry], 'humeur', '7J')
    expect(points[0]).toEqual({ value: 0, hasValue: false })
  })

  it('ignore une clé absente de subscale_scores', () => {
    const entry = makeEntry(0, 5, { energie: 6 })
    const points = buildChartData([entry], 'humeur', '7J')
    expect(points[6]).toEqual({ value: 0, hasValue: false })
  })
})

describe('buildChartData — 1M', () => {
  it('produit 30 points', () => {
    expect(buildChartData([], 'humeur', '1M')).toHaveLength(30)
  })

  it("place l'entrée d'aujourd'hui au dernier index", () => {
    const entry = makeEntry(0, 5, { humeur: 9 })
    const points = buildChartData([entry], 'humeur', '1M')
    expect(points[29]).toEqual({ value: 9, hasValue: true })
  })
})

describe('buildChartData — 3M', () => {
  it('produit 13 points (buckets hebdomadaires)', () => {
    expect(buildChartData([], 'humeur', '3M')).toHaveLength(13)
  })

  it('moyenne les entrées du même bucket', () => {
    const entries = [makeEntry(0, 0, { humeur: 6 }), makeEntry(1, 0, { humeur: 4 })]
    const points = buildChartData(entries, 'humeur', '3M')
    expect(points[12].hasValue).toBe(true)
    expect(points[12].value).toBeCloseTo(5)
  })

  it('bucket vide → hasValue:false', () => {
    const points = buildChartData([], 'humeur', '3M')
    expect(points[12]).toEqual({ value: 0, hasValue: false })
  })
})

describe('buildChartData — 6M', () => {
  it('produit 26 points (buckets hebdomadaires)', () => {
    expect(buildChartData([], 'humeur', '6M')).toHaveLength(26)
  })
})

describe('buildChartData — 1A', () => {
  it('produit 12 points (buckets mensuels)', () => {
    expect(buildChartData([], 'humeur', '1A')).toHaveLength(12)
  })

  it('moyenne les entrées du mois courant', () => {
    const entries = [makeEntry(0, 0, { humeur: 10 }), makeEntry(2, 0, { humeur: 6 })]
    const points = buildChartData(entries, 'humeur', '1A')
    expect(points[11].hasValue).toBe(true)
    expect(points[11].value).toBeCloseTo(8)
  })
})

// ── buildTotalScoreChartData ──────────────────────────────────────────────────

describe('buildTotalScoreChartData', () => {
  it("place total_score d'aujourd'hui au dernier index (7J)", () => {
    const points = buildTotalScoreChartData([makeEntry(0, 18)], '7J')
    expect(points[6]).toEqual({ value: 18, hasValue: true })
  })

  it('tous invalides sans entrées (1M)', () => {
    const points = buildTotalScoreChartData([], '1M')
    expect(points).toHaveLength(30)
    expect(points.every(p => !p.hasValue)).toBe(true)
  })

  it('moyenne les total_score dans un bucket hebdomadaire (3M)', () => {
    const entries = [makeEntry(0, 10), makeEntry(1, 20)]
    const points = buildTotalScoreChartData(entries, '3M')
    expect(points[12].hasValue).toBe(true)
    expect(points[12].value).toBeCloseTo(15)
  })

  it('moyenne les total_score dans le mois courant (1A)', () => {
    const entries = [makeEntry(0, 12), makeEntry(1, 6)]
    const points = buildTotalScoreChartData(entries, '1A')
    expect(points[11].hasValue).toBe(true)
    expect(points[11].value).toBeCloseTo(9)
  })
})

// ── buildCompositeData ────────────────────────────────────────────────────────

describe('buildCompositeData', () => {
  it('retourne un tableau vide si aucune clé', () => {
    expect(buildCompositeData([], [], '7J')).toHaveLength(0)
  })

  it('avec une seule clé, identique à buildChartData', () => {
    const entry = makeEntry(0, 0, { humeur: 7 })
    const composite = buildCompositeData([entry], ['humeur'], '7J')
    const direct = buildChartData([entry], 'humeur', '7J')
    expect(composite[6]).toEqual(direct[6])
  })

  it('moyenne les valeurs de plusieurs clés pour chaque slot', () => {
    const entry = makeEntry(0, 0, { humeur: 8, energie: 4 })
    const points = buildCompositeData([entry], ['humeur', 'energie'], '7J')
    expect(points[6]).toEqual({ value: 6, hasValue: true })
  })

  it('slot invalide si toutes les clés sont absentes', () => {
    const entry = makeEntry(0, 0, { energie: 5 })
    const points = buildCompositeData([entry], ['humeur', 'inconnu'], '7J')
    expect(points[6]).toEqual({ value: 0, hasValue: false })
  })

  it('exclut les clés invalides de la moyenne', () => {
    const entry = makeEntry(0, 0, { humeur: 6, inconnu: undefined as unknown as number })
    const points = buildCompositeData([entry], ['humeur', 'inconnu'], '7J')
    // inconnu est undefined → hasValue:false → exclu de la moyenne
    expect(points[6]).toEqual({ value: 6, hasValue: true })
  })
})

// ── buildXLabels ──────────────────────────────────────────────────────────────

describe('buildXLabels', () => {
  it('7J — produit 7 labels avec indices 0 à 6', () => {
    const labels = buildXLabels('7J', 'fr-FR')
    expect(labels).toHaveLength(7)
    expect(labels[0].index).toBe(0)
    expect(labels[6].index).toBe(6)
  })

  it("7J — le dernier label est le numéro du jour courant", () => {
    const labels = buildXLabels('7J', 'fr-FR')
    expect(labels[6].label).toBe(String(new Date(TODAY).getDate()))
  })

  it('1M — produit 4 labels aux indices 0, 9, 19, 29', () => {
    const labels = buildXLabels('1M', 'fr-FR')
    expect(labels.map(l => l.index)).toEqual([0, 9, 19, 29])
  })

  it('1A — produit 12 labels', () => {
    expect(buildXLabels('1A', 'fr-FR')).toHaveLength(12)
  })

  it('3M — un seul label par mois (indices uniques)', () => {
    const labels = buildXLabels('3M', 'fr-FR')
    const indices = labels.map(l => l.index)
    expect(new Set(indices).size).toBe(indices.length)
  })

  it('6M — un seul label par mois (indices uniques)', () => {
    const labels = buildXLabels('6M', 'fr-FR')
    const indices = labels.map(l => l.index)
    expect(new Set(indices).size).toBe(indices.length)
  })
})

// ── markerXFraction ───────────────────────────────────────────────────────────

describe('markerXFraction', () => {
  it('retourne null pour une chaîne non parseable', () => {
    expect(markerXFraction('not-a-date', '7J')).toBeNull()
  })

  it('retourne null pour une date incomplète (2 parties)', () => {
    expect(markerXFraction('2026-06', '7J')).toBeNull()
  })

  it("retourne 1 pour aujourd'hui, toutes plages", () => {
    const today = '2026-06-03'
    expect(markerXFraction(today, '7J')).toBeCloseTo(1)
    expect(markerXFraction(today, '1M')).toBeCloseTo(1)
    expect(markerXFraction(today, '1A')).toBeCloseTo(1)
  })

  it('retourne ~0 pour le premier point de la plage 7J (il y a 6 jours)', () => {
    expect(markerXFraction('2026-05-28', '7J')).toBeCloseTo(0)
  })

  it('retourne 0.5 pour une date au milieu de la plage 7J', () => {
    // il y a 3 jours, span=6 → 1 - 3/6 = 0.5
    expect(markerXFraction('2026-05-31', '7J')).toBeCloseTo(0.5)
  })

  it('retourne null pour une date avant la fenêtre (il y a 7 jours en 7J)', () => {
    expect(markerXFraction('2026-05-27', '7J')).toBeNull()
  })

  it('retourne null pour une date dans le futur', () => {
    expect(markerXFraction('2026-06-04', '7J')).toBeNull()
  })
})
