import { describe, it, expect } from 'vitest'
import type { SleepPoint, FearPoint, MoodPoint, ScorePoint, ActivityEntryPoint, MedEffectPoint } from '@services/engagementService'
import { sleepCard, fearCard, moodCard, scaleCard, activationCard, medCard, namingCard, NAMING_MIN_ENTRIES } from './overviewMetrics'
import type { EmotionNamingEntry, NamingTaxonomy } from '../../../lib/emotionNamingData'

const NOW = new Date(2026, 6, 14, 12).getTime()
const DAY = 86_400_000
const iso = (daysAgo: number) => new Date(NOW - daysAgo * DAY).toISOString()

describe('overviewMetrics.sleepCard', () => {
  it('métrique = moyenne 30 j de l’efficacité + sparkline', () => {
    const pts = [
      { date: iso(2), efficiency: 80 }, { date: iso(5), efficiency: 90 },
    ] as SleepPoint[]
    const card = sleepCard(pts, NOW)
    expect(card.kind).toBe('metric')
    if (card.kind === 'metric') {
      expect(card.value).toBe(85)
      expect(card.unit).toBe('%')
      expect(card.sparkline.length).toBeGreaterThan(0)
    }
  })

  it('aucune saisie dans la fenêtre → carte « en attente »', () => {
    const card = sleepCard([{ date: iso(90), efficiency: 70 }] as SleepPoint[], NOW)
    expect(card.kind).toBe('empty')
  })
})

describe('overviewMetrics.fearCard', () => {
  it('métrique = moyenne du delta SUDS (après - avant)', () => {
    const pts = [{ date: iso(1), suds_before: 80, suds_after: 40 }] as FearPoint[]
    const card = fearCard(pts, NOW)
    expect(card.kind).toBe('metric')
    if (card.kind === 'metric') expect(card.value).toBe(-40)
  })
})

describe('overviewMetrics.activationCard', () => {
  it('métrique = taux de réalisation (%) sur 30 j', () => {
    const entries = [
      { date: iso(1), done: true }, { date: iso(2), done: false },
    ] as ActivityEntryPoint[]
    const card = activationCard(entries, NOW)
    expect(card.kind).toBe('metric')
    if (card.kind === 'metric') expect(card.value).toBe(50) // 1 done / 2
  })
})

describe('overviewMetrics.scaleCard', () => {
  it('métrique = moyenne du score brut', () => {
    const pts = [{ date: iso(1), score: 12 }, { date: iso(3), score: 8 }] as ScorePoint[]
    const card = scaleCard('phq9', pts, NOW)
    expect(card.kind).toBe('metric')
    if (card.kind === 'metric') {
      expect(card.value).toBe(10)
      expect(card.domain[1]).toBeGreaterThan(0)
      // Label = nom de l'échelle (aligné sur la section), pas la clé de config par défaut.
      expect(card.labelKey).toBe('evolution.scale_phq9')
      expect(card.metricLabelKey).toBe('evolution.overview_scale_metric')
    }
  })
})

describe('overviewMetrics.medCard', () => {
  it('carte empreinte : une barre par effet (moyenne 30 j, aucun composite)', () => {
    const pts = [
      { date: iso(1), nausea: 4, insomnia: 6 },
      { date: iso(3), nausea: 6, insomnia: 2 },
    ] as MedEffectPoint[]
    const card = medCard(['nausea', 'insomnia'], pts, e => `label:${e}`, NOW)
    expect(card.kind).toBe('fingerprint')
    if (card.kind === 'fingerprint') {
      expect(card.bars).toHaveLength(2)
      expect(card.bars[0]).toMatchObject({ key: 'nausea', label: 'label:nausea', value: 5 })
      expect(card.bars[1]).toMatchObject({ key: 'insomnia', value: 4 })
      expect(card.daysLogged).toBe(2)
    }
  })

  it('aucune saisie récente → carte « en attente »', () => {
    const card = medCard(['nausea'], [{ date: iso(90), nausea: 5 }] as MedEffectPoint[], e => e, NOW)
    expect(card.kind).toBe('empty')
  })
})

describe('overviewMetrics.moodCard', () => {
  it('carte empreinte 6 barres (aucun agrégat global)', () => {
    const pts = [
      { date: iso(1), humeur: 7, energie: 6, anxiete: 4, plaisir: 5, sommeil: 8, alimentation: 6 },
    ] as MoodPoint[]
    const card = moodCard(pts, k => k, NOW)
    expect(card.kind).toBe('fingerprint')
    if (card.kind === 'fingerprint') {
      expect(card.bars).toHaveLength(6)
      expect(card.daysLogged).toBeGreaterThanOrEqual(1)
    }
  })

  it('aucune saisie récente → carte « en attente »', () => {
    const card = moodCard([{ date: iso(90), humeur: 5 }] as MoodPoint[], k => k, NOW)
    expect(card.kind).toBe('empty')
  })
})

describe('overviewMetrics.namingCard', () => {
  const TAXONOMY: NamingTaxonomy = {
    families: ['fam.joy', 'fam.fear'],
    nuancesByFamily: { 'fam.joy': ['n.a', 'n.b'], 'fam.fear': ['n.c'] },
    wordsByNuance: { 'n.a': ['w.1'], 'n.b': [], 'n.c': [] },
    words: ['w.1'],
    colorByFamily: {},
  }
  const fmt = (key: string, values: Record<string, number>) => `${key}:${JSON.stringify(values)}`
  const naming = (daysAgo: number, over: Partial<EmotionNamingEntry> = {}): EmotionNamingEntry => ({
    date: iso(daysAgo),
    familyCode: 'fam.joy', nuanceCode: 'n.a', wordCode: null,
    intensity: null, context: [], contextOther: null, notes: null,
    ...over,
  })

  it('rend une carte d effectifs, jamais une metrique ni une sparkline', () => {
    const entries = Array.from({ length: NAMING_MIN_ENTRIES }, (_, i) => naming(i))
    const card = namingCard(entries, TAXONOMY, fmt, NOW)
    expect(card.kind).toBe('counts')
    expect(card).not.toHaveProperty('sparkline')
    expect(card).not.toHaveProperty('bars')
    if (card.kind !== 'counts') throw new Error('kind attendu : counts')
    expect(card.lines[0]).toContain(`"count":${NAMING_MIN_ENTRIES}`)
    expect(card.lines[1]).toContain('"used":1,"total":3')
  })

  it('reste « en attente de saisies » sous le seuil', () => {
    const entries = Array.from({ length: NAMING_MIN_ENTRIES - 1 }, (_, i) => naming(i))
    expect(namingCard(entries, TAXONOMY, fmt, NOW).kind).toBe('empty')
  })

  it('ne compte que la fenetre de 30 jours glissants', () => {
    const entries = [
      ...Array.from({ length: NAMING_MIN_ENTRIES }, (_, i) => naming(i)),
      ...Array.from({ length: 5 }, () => naming(200)),
    ]
    const card = namingCard(entries, TAXONOMY, fmt, NOW)
    if (card.kind !== 'counts') throw new Error('kind attendu : counts')
    expect(card.lines[0]).toContain(`"count":${NAMING_MIN_ENTRIES}`)
  })
})