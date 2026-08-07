import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ScaleEvolutionChart } from './ScaleEvolutionChart'
import type { EvolutionEntry } from './evolutionLayout'

const t = (key: string, options?: Record<string, string | number>): string =>
  options == null ? key : `${key}|${Object.values(options).join('|')}`

const BANDS = [
  { id: 'q9', label: 'Réponse à l\'item 9' },
  { id: 'q10', label: 'Item 10, hors score' },
]

/** Intervalles IRRÉGULIERS : c'est le seul jeu qui révèle un défaut d'alignement. */
const IRREGULAR: EvolutionEntry[] = [
  { id: 'a', date: '2026-06-30T10:00:00Z', score: 21, bandCodes: ['opt_0', 'q10_opt_2'] },
  { id: 'b', date: '2026-07-14T10:00:00Z', score: 22, bandCodes: ['opt_1', 'q10_opt_2'] },
  { id: 'c', date: '2026-08-29T10:00:00Z', score: 13, bandCodes: ['opt_0', 'q10_opt_1'] },
]

function renderChart(entries: EvolutionEntry[] = IRREGULAR, bands = BANDS) {
  return render(
    <ScaleEvolutionChart
      entries={entries}
      bands={bands}
      yMax={27}
      color="#6366F1"
      locale="fr-FR"
      citation="PHQ-9, Kroenke, Spitzer & Williams, 2001"
      t={t}
    />,
  )
}

/** Abscisses lues sur le DOM, dans l'ordre de rendu. */
function leftsOf(container: HTMLElement, selector: string): string[] {
  return [...container.querySelectorAll<HTMLElement>(selector)].map(el => el.style.left)
}

describe('ScaleEvolutionChart : alignement des bandes', () => {
  it('aligne les cellules de bande sur les abscisses des points, à intervalles irréguliers', () => {
    // LE test du ticket. Le défaut trouvé en revue de maquette : les bandes vivaient
    // dans un espace de coordonnées indépendant, et la valeur du 28 juillet
    // s'affichait sous le point du 14. Invisible tant qu'on teste à intervalles
    // réguliers, où rang et temps coïncident.
    const { container } = renderChart()

    const points = leftsOf(container, '.sec__point')
    expect(points).toHaveLength(3)

    for (const band of container.querySelectorAll<HTMLElement>('.sec__band-row')) {
      expect([...band.querySelectorAll<HTMLElement>('.sec__band-cell')].map(c => c.style.left))
        .toEqual(points)
    }
  })

  it('aligne aussi les valeurs et les dates sur ces mêmes abscisses', () => {
    const { container } = renderChart()
    const points = leftsOf(container, '.sec__point')

    expect(leftsOf(container, '.sec__value')).toEqual(points)
    expect(leftsOf(container, '.sec__date')).toEqual(points)
  })

  it('espace les colonnes en TEMPS, pas en rang', () => {
    // 14 jours puis 46 : la colonne du milieu doit être au premier tiers, pas au milieu.
    const { container } = renderChart()
    const middle = Number.parseFloat(leftsOf(container, '.sec__point')[1])

    expect(middle).toBeCloseTo((14 / 60) * 100, 5)
    expect(middle).not.toBeCloseTo(50, 1)
  })
})

describe('ScaleEvolutionChart : conformité MDR', () => {
  it('ne dessine aucune bande de sévérité ni ligne de seuil', () => {
    const { container } = renderChart()

    // Les seules lignes horizontales sont les graduations, au pas de 5 sur 0 à 27.
    const grid = container.querySelectorAll('.sec__grid')
    expect(grid).toHaveLength(6)
    expect([...container.querySelectorAll('.sec__tick')].map(el => el.textContent))
      .toEqual(['0', '5', '10', '15', '20', '25'])
    // Aucun aplat de fond : pas de <rect> dans le graphe.
    expect(container.querySelectorAll('rect')).toHaveLength(0)
  })

  it('rend toutes les cellules de bande à l\'identique, quelle que soit la réponse', () => {
    // Teinter « Presque tous les jours » serait un jugement de gravité rendu par le
    // logiciel. La signature de balisage doit être la même partout.
    const { container } = renderChart()

    const signatures = [...container.querySelectorAll<HTMLElement>('.sec__band-cell')].map(el => ({
      tag: el.tagName,
      className: el.className,
      // `left` mis à part, aucun style ne doit varier d'une cellule à l'autre.
      color: el.style.color,
      background: el.style.background,
      fontWeight: el.style.fontWeight,
    }))
    const first = signatures[0]
    for (const s of signatures) {
      expect({ ...s, left: undefined }).toEqual({ ...first, left: undefined })
    }
  })

  it('n\'affiche ni adjectif, ni moyenne, ni projection', () => {
    const text = (renderChart().container.textContent ?? '').toLowerCase()
    for (const word of ['sévère', 'modéré', 'moyenne', 'tendance', 'amélioration', 'seuil']) {
      expect(text).not.toContain(word)
    }
  })

  it('porte la citation des auteurs, que la maquette avait oubliée', () => {
    const { container } = renderChart()
    expect(container.querySelector('[data-testid="source-citation"]')?.textContent)
      .toContain('Kroenke')
  })
})

describe('ScaleEvolutionChart : cas limites', () => {
  it('ne trace pas de courbe sur une seule passation, sans laisser l\'écran vide', () => {
    const { container } = renderChart([IRREGULAR[0]])

    expect(container.querySelectorAll('polyline')).toHaveLength(0)
    // Le point, sa valeur et ses bandes restent lisibles.
    expect(container.querySelectorAll('.sec__point')).toHaveLength(1)
    expect(container.querySelector('.sec__value')?.textContent).toBe('21')
  })

  it('laisse un trou dans la bande d\'un item absent, sans décaler les colonnes', () => {
    // Passation à 9 items, antérieure à l'arrivée de l'item 10.
    const { container } = renderChart([
      { id: 'a', date: '2026-06-30T10:00:00Z', score: 21, bandCodes: ['opt_0', null] },
      { id: 'b', date: '2026-07-14T10:00:00Z', score: 22, bandCodes: ['opt_1', 'q10_opt_2'] },
    ])

    const rows = container.querySelectorAll('.sec__band-row')
    const item10 = [...rows[1].querySelectorAll<HTMLElement>('.sec__band-cell')]
    expect(item10[0].textContent).toBe('-')
    expect(item10[1].textContent).toBe('q10_opt_2')
    // Les deux colonnes restent à leur abscisse.
    expect(item10.map(c => c.style.left)).toEqual(leftsOf(container, '.sec__point'))
  })

  it('annonce une fenêtre sans passation plutôt que de rendre un cadre vide', () => {
    const { container } = renderChart([])
    expect(container.textContent).toContain('scales.evolution.empty')
    expect(container.querySelector('.sec__chart')).toBeNull()
  })

  it('reste lisible à 40 passations en élargissant le tracé', () => {
    const many: EvolutionEntry[] = Array.from({ length: 40 }, (_, i) => ({
      id: `p${i}`,
      date: new Date(Date.UTC(2025, 0, 1 + i * 14)).toISOString(),
      score: 10,
      bandCodes: ['opt_0', 'q10_opt_1'],
    }))
    const { container } = renderChart(many)

    const plot = container.querySelector<HTMLElement>('.sec__plot')
    expect(Number.parseInt(plot?.style.minWidth ?? '0', 10)).toBeGreaterThanOrEqual(40 * 60)
    expect(container.querySelectorAll('.sec__point')).toHaveLength(40)
  })

  it('ne rend aucune bande quand l\'échelle n\'en déclare pas', () => {
    const { container } = renderChart(IRREGULAR, [])
    expect(container.querySelectorAll('.sec__band')).toHaveLength(0)
    expect(container.querySelectorAll('.sec__point')).toHaveLength(3)
  })
})
