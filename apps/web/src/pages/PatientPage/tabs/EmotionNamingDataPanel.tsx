// Panneau « Données » du module « Nommer ce que je ressens » (écran 1a, #263).
//
// Pourquoi une matrice et pas une courbe : ce module produit une CATÉGORIE (famille ·
// nuance · mot), pas une série numérique. Une courbe d'intensité toutes familles
// confondues mélangerait la joie et la honte. La matrice, elle, répond à la seule
// question qu'on se pose en séance : DE QUOI CE PATIENT N'ARRIVE-T-IL JAMAIS À PARLER ?
// Elle rend visible le territoire vide, ce qu'aucune courbe ne fait.
//
// Conformité MDR 2017/745 :
//   · les comptes sont BRUTS, jamais de moyenne, de tendance ni de comparaison ;
//   · l'opacité du fond code un NOMBRE DE SAISIES, jamais une intensité ni une
//     gravité ; la teinte est l'identité de la famille ;
//   · les nuances jamais employées restent affichées, sans chiffre : leur absence est
//     du contenu, pas de la décoration.

import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Card } from '@ui/Card'
import { Chip } from '@ui/Chip'
import { SegmentedControl } from '@ui/SegmentedControl'
import { moduleQueries } from '../../../hooks/queries'
import type { EmotionNamingRow } from '@services/engagementService'
import {
  buildNamingTaxonomy, repertoire, depthCounts, filterByRange, readIntensityMax,
  type RepertoireLevel,
} from '../../../lib/emotionNamingData'
import { EmotionNamingEntryList } from './EmotionNamingEntryList'
import './EmotionNamingDataPanel.css'

// Mêmes fenêtres que la page Évolution : un seul vocabulaire de période dans l'app.
const RANGES = [30, 90, 180, 365] as const
type Range = (typeof RANGES)[number]

// Paliers de densité du fond d'une cellule, en canal alpha hexadécimal appliqué à la
// teinte de famille. Ils codent un NOMBRE DE SAISIES : plus le patient a employé ce
// mot, plus la case est dense. Aucun lien avec l'intensité, aucune gravité (MDR).
function fillAlpha(count: number): string {
  if (count === 1) return '2E'
  if (count <= 3) return '57'
  if (count <= 6) return '80'
  return 'A8'
}

interface Props {
  entries: EmotionNamingRow[]
  moduleType: string
  locale: string
}

export function EmotionNamingDataPanel({ entries, moduleType, locale }: Props) {
  const { t } = useTranslation()
  const [range, setRange] = useState<Range>(30)
  const [level, setLevel] = useState<RepertoireLevel>('nuance')

  const fieldsQuery = useQuery(moduleQueries.fields(moduleType))
  const taxonomy = useMemo(
    () => buildNamingTaxonomy(fieldsQuery.data?.fields ?? []),
    [fieldsQuery.data],
  )
  // Borne de l'échelle lue en config : le passage de 1-10 à 1-5 se reflète ici sans
  // redéploiement, et les anciennes saisies gardent leur valeur d'origine.
  const intensityMax = useMemo(
    () => readIntensityMax(fieldsQuery.data?.fields ?? []),
    [fieldsQuery.data],
  )

  // Une seule fenêtre pour la synthèse ET la matrice : les chiffres du haut décrivent
  // exactement ce que la matrice montre.
  const windowed = useMemo(() => filterByRange(entries, range, new Date()), [entries, range])
  const rep = useMemo(() => repertoire(windowed, taxonomy, level), [windowed, taxonomy, level])
  const depths = useMemo(() => depthCounts(windowed), [windowed])

  const handleRangeChange = useCallback((value: string) => setRange(Number(value) as Range), [])
  const showNuances = useCallback(() => setLevel('nuance'), [])
  const showWords = useCallback(() => setLevel('word'), [])

  const lastDate = windowed.length > 0 ? windowed[windowed.length - 1].date : null
  const usedLabel = level === 'nuance'
    ? `${rep.nuancesUsed} / ${rep.nuancesTotal}`
    : `${rep.wordsUsed} / ${rep.wordsTotal}`

  return (
    <div className="enp">
      <div className="enp__controls">
        <SegmentedControl
          options={RANGES.map(days => ({
            value: String(days),
            label: t(`evolution.range_${days}`, { defaultValue: `${days} j` }),
          }))}
          value={String(range)}
          onChange={handleRangeChange}
        />
        <div className="enp__level" role="group" aria-label={t('emotion_naming.level_label')}>
          <Chip
            label={t('emotion_naming.level_nuance')}
            size="sm"
            selectable
            selected={level === 'nuance'}
            onClick={showNuances}
          />
          <Chip
            label={t('emotion_naming.level_word')}
            size="sm"
            selectable
            selected={level === 'word'}
            onClick={showWords}
          />
        </div>
      </div>

      <div className="enp__summary">
        <Card variant="outlined">
          <span className="enp__stat-label">{t('emotion_naming.stat_entries')}</span>
          <span className="enp__stat-value">{windowed.length}</span>
        </Card>
        <Card variant="outlined">
          <span className="enp__stat-label">{t('emotion_naming.stat_last')}</span>
          <span className="enp__stat-value">
            {lastDate ? new Date(lastDate).toLocaleDateString(locale) : '-'}
          </span>
        </Card>
        <Card variant="outlined">
          <span className="enp__stat-label">
            {level === 'nuance'
              ? t('emotion_naming.stat_nuances')
              : t('emotion_naming.stat_words')}
          </span>
          <span className="enp__stat-value">{usedLabel}</span>
        </Card>
        <Card variant="outlined">
          <span className="enp__stat-label">{t('emotion_naming.stat_wordless')}</span>
          <span className="enp__stat-value">{depths.none} / {windowed.length}</span>
        </Card>
      </div>

      <div className="enp__matrix" data-testid="repertoire-matrix">
        {rep.rows.map(row => {
          const color = taxonomy.colorByFamily[row.familyCode] ?? 'var(--color-border)'
          return (
            <div className="enp__row" key={row.familyCode} data-testid={`row-${row.familyCode}`}>
              <div className="enp__row-head" style={{ borderLeftColor: color }}>
                <span className="enp__row-name">{t(row.familyCode)}</span>
                <span className="enp__row-total">{row.total}</span>
              </div>
              <div className="enp__cells">
                {row.cells.map(cell => (
                  <div
                    key={cell.nuanceCode}
                    className={`enp__cell ${cell.count === 0 ? 'enp__cell--unused' : ''}`}
                    // Calcul dynamique ponctuel : la teinte vient de la config du
                    // module, elle ne peut pas vivre dans le CSS.
                    style={cell.count > 0
                      ? { backgroundColor: `${color}${fillAlpha(cell.count)}` }
                      : undefined}
                    data-testid={`cell-${cell.nuanceCode}`}
                  >
                    <span className="enp__cell-name">{t(cell.nuanceCode)}</span>
                    {cell.count > 0 ? (
                      <span className="enp__cell-count">{cell.count}</span>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <p className="enp__legend">{t('emotion_naming.legend')}</p>

      <EmotionNamingEntryList
        entries={windowed}
        colorByFamily={taxonomy.colorByFamily}
        intensityMax={intensityMax}
        locale={locale}
      />
    </div>
  )
}
