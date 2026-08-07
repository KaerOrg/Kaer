import { describe, it, expect } from 'vitest'
import {
  buildEvolutionLayout,
  filterByWindow,
  GRID_STEP,
  type EvolutionEntry,
} from './evolutionLayout'

function entry(over: Partial<EvolutionEntry> & Pick<EvolutionEntry, 'id' | 'date'>): EvolutionEntry {
  return { score: 10, bandCodes: [], ...over }
}

describe('buildEvolutionLayout : axe des x régulier en TEMPS', () => {
  it('espace les passations proportionnellement à leur écart de dates', () => {
    // Le piège du ticket : indexer par rang égaliserait ces trois intervalles inégaux
    // et rendrait les pentes incomparables d'un segment à l'autre.
    const { entries } = buildEvolutionLayout([
      entry({ id: 'a', date: '2026-06-01T10:00:00Z' }),
      entry({ id: 'b', date: '2026-06-15T10:00:00Z' }), // +14 j
      entry({ id: 'c', date: '2026-07-31T10:00:00Z' }), // +46 j
    ], 27)

    expect(entries[0].xPct).toBe(0)
    expect(entries[2].xPct).toBe(100)
    // 14 jours sur 60 = 23,33 %, et surtout PAS 50 % (ce que donnerait le rang).
    expect(entries[1].xPct).toBeCloseTo((14 / 60) * 100, 5)
    expect(entries[1].xPct).not.toBeCloseTo(50, 1)
  })

  it('donne à chaque passation UNE abscisse, celle que la courbe et les bandes partagent', () => {
    // Cœur du défaut trouvé en revue : deux espaces de coordonnées indépendants. Ici il
    // n'y en a qu'un, et le tracé se déduit littéralement des mêmes xPct.
    const { entries, segments } = buildEvolutionLayout([
      entry({ id: 'a', date: '2026-06-01T10:00:00Z', score: 0 }),
      entry({ id: 'b', date: '2026-06-15T10:00:00Z', score: 27 }),
      entry({ id: 'c', date: '2026-07-31T10:00:00Z', score: 0 }),
    ], 27)

    const xs = entries.map(e => e.xPct.toFixed(2))
    expect(segments[0].split(' ').map(p => p.split(',')[0])).toEqual(xs)
  })

  it('trie les passations avant de les projeter', () => {
    const { entries } = buildEvolutionLayout([
      entry({ id: 'b', date: '2026-06-15T10:00:00Z' }),
      entry({ id: 'a', date: '2026-06-01T10:00:00Z' }),
    ], 27)

    expect(entries.map(e => e.id)).toEqual(['a', 'b'])
  })

  it('centre une passation unique plutôt que de la coller au bord', () => {
    const { entries } = buildEvolutionLayout([entry({ id: 'a', date: '2026-06-01T10:00:00Z' })], 27)
    expect(entries[0].xPct).toBe(50)
  })
})

describe('buildEvolutionLayout : axe vertical', () => {
  it('projette le score sur la hauteur, 0 en bas', () => {
    const { entries } = buildEvolutionLayout([
      entry({ id: 'a', date: '2026-06-01T10:00:00Z', score: 0 }),
      entry({ id: 'b', date: '2026-06-15T10:00:00Z', score: 27 }),
    ], 27)

    expect(entries[0].yPct).toBe(100)
    expect(entries[1].yPct).toBe(0)
  })

  it('borne un score hors domaine au lieu de sortir du cadre', () => {
    const { entries } = buildEvolutionLayout([
      entry({ id: 'a', date: '2026-06-01T10:00:00Z', score: 99 }),
    ], 27)

    expect(entries[0].yPct).toBe(0)
  })

  it('gradue tous les 5 points, la seule graduation qui mérite d\'être dessinée', () => {
    // 5 points est le plus petit écart individuellement interprétable du PHQ-9.
    const { gridLines } = buildEvolutionLayout([], 27)

    expect(GRID_STEP).toBe(5)
    expect(gridLines.map(g => g.value)).toEqual([0, 5, 10, 15, 20, 25])
    expect(gridLines[0].yPct).toBe(100)
  })
})

describe('buildEvolutionLayout : cas limites', () => {
  it('ne trace AUCUNE courbe sur une seule passation', () => {
    const { segments, entries } = buildEvolutionLayout([
      entry({ id: 'a', date: '2026-06-01T10:00:00Z' }),
    ], 27)

    expect(segments).toEqual([])
    expect(entries).toHaveLength(1)
  })

  it('interrompt le tracé sur un total manquant, sans le faire passer par zéro', () => {
    const { segments, entries } = buildEvolutionLayout([
      entry({ id: 'a', date: '2026-06-01T10:00:00Z', score: 20 }),
      entry({ id: 'b', date: '2026-06-15T10:00:00Z', score: 18 }),
      entry({ id: 'c', date: '2026-07-01T10:00:00Z', score: null }),
      entry({ id: 'd', date: '2026-07-15T10:00:00Z', score: 14 }),
      entry({ id: 'e', date: '2026-08-01T10:00:00Z', score: 13 }),
    ], 27)

    expect(segments).toHaveLength(2)
    expect(entries[2].yPct).toBeNull()
  })

  it('garde la colonne d\'une passation sans item suivi, sans décaler les suivantes', () => {
    // Une passation à 9 items, antérieure à l'arrivée de l'item 10 : la bande a un
    // trou, et comme chaque colonne est positionnée en absolu, rien ne bouge.
    const { entries } = buildEvolutionLayout([
      entry({ id: 'a', date: '2026-06-01T10:00:00Z', bandCodes: ['opt_1', null] }),
      entry({ id: 'b', date: '2026-06-15T10:00:00Z', bandCodes: ['opt_0', 'q10_opt_2'] }),
    ], 27)

    expect(entries[0].bandCodes).toEqual(['opt_1', null])
    expect(entries[0].xPct).toBe(0)
    expect(entries[1].xPct).toBe(100)
  })

  it('ne rend rien d\'aberrant sans aucune passation', () => {
    const layout = buildEvolutionLayout([], 27)
    expect(layout.entries).toEqual([])
    expect(layout.segments).toEqual([])
  })
})

describe('filterByWindow', () => {
  const SERIES = [
    { id: 'old', date: '2025-01-01T10:00:00Z' },
    { id: 'mid', date: '2026-03-01T10:00:00Z' },
    { id: 'new', date: '2026-08-01T10:00:00Z' },
  ]

  it('rend tout l\'historique sur « tout »', () => {
    expect(filterByWindow(SERIES, 'all')).toHaveLength(3)
  })

  it('compte depuis la passation la plus récente, jamais depuis aujourd\'hui', () => {
    // Un suivi interrompu il y a trois mois doit rester lisible : compter depuis
    // aujourd'hui viderait l'écran d'un patient qui a arrêté.
    expect(filterByWindow(SERIES, '6m').map(e => e.id)).toEqual(['mid', 'new'])
    expect(filterByWindow(SERIES, '1y').map(e => e.id)).toEqual(['mid', 'new'])
  })

  it('ne plante pas sur une série vide', () => {
    expect(filterByWindow([], '6m')).toEqual([])
  })
})
