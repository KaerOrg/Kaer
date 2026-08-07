import { useMemo } from 'react'
import { SourceCitation } from '../SourceCitation'
import { buildEvolutionLayout, type EvolutionEntry } from './evolutionLayout'
import './ScaleEvolutionChart.css'

/** Valeur absente dans une bande : trait d'union simple, jamais un tiret long. */
const NO_VALUE = '-'

/** Largeur minimale réservée à une passation, pour rester lisible à 40 colonnes. */
const MIN_COLUMN_PX = 76

/** Une bande sous la courbe : un item suivi, passation par passation. */
export interface EvolutionBand {
  readonly id: string
  /** Intitulé de la bande, déjà traduit. */
  readonly label: string
}

export interface ScaleEvolutionChartProps {
  readonly entries: readonly EvolutionEntry[]
  /** Bandes, dans l'ordre des `bandCodes` de chaque passation. */
  readonly bands: readonly EvolutionBand[]
  /** Borne haute de l'axe, dérivée de la configuration de l'échelle. */
  readonly yMax: number
  readonly color: string
  readonly locale: string
  /** Citation des auteurs (#417) : cette vue affiche des scores dérivés de l'instrument. */
  readonly citation: string
  readonly translationAttribution?: string | null
  readonly t: (key: string, options?: Record<string, string | number>) => string
}

/**
 * Vue Évolution d'une échelle, côté praticien (#420, QW-3).
 *
 * **Ce que la vue s'interdit** (MDR 2017/745) : aucune bande de sévérité en fond,
 * aucune ligne de seuil, aucune flèche « amélioration », aucune moyenne, aucune
 * projection. Une courbe sur fond neutre : le praticien lit un déplacement, le logiciel
 * ne le qualifie pas.
 *
 * **Ce qu'elle ajoute** : deux bandes sous la courbe, alignées sur les mêmes abscisses
 * que les points. Un total qui baisse de 22 à 13 pendant que le retentissement reste
 * « très difficile » ne raconte pas la même chose qu'une baisse accompagnée d'un retour
 * au travail.
 *
 * **L'alignement est structurel, pas surveillé.** Points, étiquettes et cellules de
 * bande lisent la MÊME abscisse, calculée une fois par `buildEvolutionLayout`. Il n'y a
 * pas deux espaces de coordonnées à synchroniser, donc rien à désynchroniser : c'est le
 * défaut que la revue de maquette avait trouvé, et il est ici irreprésentable.
 *
 * Présentationnel pur : données, libellés et mentions injectés par le parent.
 */
export function ScaleEvolutionChart({
  entries, bands, yMax, color, locale, citation, translationAttribution, t,
}: ScaleEvolutionChartProps) {
  const layout = useMemo(() => buildEvolutionLayout(entries, yMax), [entries, yMax])

  // Largeur du tracé : au moins une colonne lisible par passation. Au-delà, le cadre
  // défile horizontalement plutôt que d'empiler des étiquettes illisibles.
  const plotStyle = useMemo(
    () => ({ minWidth: `${layout.entries.length * MIN_COLUMN_PX}px` }),
    [layout.entries.length],
  )

  const dateLabel = (iso: string) =>
    new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'short' })

  if (layout.entries.length === 0) {
    return <p className="sec__empty">{t('scales.evolution.empty')}</p>
  }

  return (
    <div className="sec">
      <div className="sec__scroll">
        <div className="sec__plot" style={plotStyle}>
          <div className="sec__chart">
            <svg
              className="sec__svg"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              {layout.gridLines.map(line => (
                <line
                  key={line.value}
                  className="sec__grid"
                  x1="0" x2="100" y1={line.yPct} y2={line.yPct}
                  vectorEffect="non-scaling-stroke"
                />
              ))}
              {layout.segments.map((points, i) => (
                <polyline
                  key={i}
                  points={points}
                  fill="none"
                  stroke={color}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </svg>

            {/* Graduations : le pas de 5 est le plus petit écart individuellement
                interprétable. Aucun seuil, aucune tranche, aucun fond teinté. */}
            {layout.gridLines.map(line => (
              <span key={line.value} className="sec__tick" style={{ top: `${line.yPct}%` }}>
                {line.value}
              </span>
            ))}

            {layout.entries.map(entry => (
              entry.yPct == null ? null : (
                <span
                  key={entry.id}
                  className="sec__point"
                  style={{ left: `${entry.xPct}%`, top: `${entry.yPct}%`, background: color }}
                />
              )
            ))}

            {layout.entries.map(entry => (
              entry.score == null ? null : (
                <span
                  key={entry.id}
                  className="sec__value"
                  style={{ left: `${entry.xPct}%`, top: `${entry.yPct ?? 0}%` }}
                >
                  {entry.score}
                </span>
              )
            ))}
          </div>

          <div className="sec__dates">
            {layout.entries.map(entry => (
              <span key={entry.id} className="sec__date" style={{ left: `${entry.xPct}%` }}>
                {dateLabel(entry.date)}
              </span>
            ))}
          </div>

          {bands.map((band, bandIndex) => (
            <div key={band.id} className="sec__band">
              <p className="sec__band-label">{band.label}</p>
              <div className="sec__band-row">
                {layout.entries.map(entry => {
                  const code = entry.bandCodes[bandIndex] ?? null
                  return (
                    <span
                      key={entry.id}
                      className="sec__band-cell"
                      style={{ left: `${entry.xPct}%` }}
                    >
                      {code == null ? NO_VALUE : t(code)}
                    </span>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Q-13 : la vue affiche des scores dérivés de l'instrument, elle porte donc la
          citation. La maquette l'avait oubliée. Sans la recommandation NICE, qui est un
          argument de crédibilité et vit au moment du choix, pas ici. */}
      <SourceCitation citation={citation} translationAttribution={translationAttribution} />
    </div>
  )
}
