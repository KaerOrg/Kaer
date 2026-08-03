// Croisement contexte × famille du module « Nommer ce que je ressens » (maquette 1c).
//
// C'est la vue la plus directement utilisable en séance : de l'analyse fonctionnelle
// prête à l'emploi (« le travail, c'est de la peur ; la famille, c'est de la colère »).
//
// Conformité MDR 2017/745 :
//   · les cellules sont des EFFECTIFS BRUTS. Aucune proportion, aucune moyenne, aucune
//     comparaison d'un contexte à l'autre, aucune conclusion ;
//   · la teinte code une densité de comptage, jamais une gravité clinique ;
//   · les saisies « Sans mot » restent HORS table (elles n'ont pas de famille) et sont
//     rappelées dessous : les diluer dans une colonne inventée fabriquerait une
//     catégorie que le patient n'a pas choisie.
//
// Sous le seuil, la table n'est pas rendue du tout : 56 cases pour une dizaine de
// saisies, c'est une table presque vide, illisible et qui invite à surinterpréter le
// peu qui s'y trouve. C'est une mesure de prudence clinique, pas d'affichage.

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { DataTable, type DataTableColumn } from '@ui/DataTable'
import { contextByFamily, CONTEXT_NONE, type EmotionNamingEntry } from '../../../lib/emotionNamingData'
import { densityOpacity, DENSITY_STEPS } from '../../../lib/emotionNamingDensity'
import './EmotionNamingCrossTable.css'

/**
 * En deçà de ce nombre de saisies dans la fenêtre, le croisement n'est pas rendu.
 * Seuil de prudence clinique, jamais un nombre magique dans le JSX.
 */
export const CROSSTAB_MIN_ENTRIES = 12

interface CrossRow {
  contextCode: string
  counts: number[]
  total: number
}

interface Props {
  readonly entries: EmotionNamingEntry[]
  /** Domaines de contexte lus en config : jamais une liste figée dans le code. */
  readonly contextCodes: string[]
  readonly familyCodes: string[]
  /** Largeur de la fenêtre en jours, rappelée dans la phrase du seuil. */
  readonly rangeDays: number
}

export function EmotionNamingCrossTable({ entries, contextCodes, familyCodes, rangeDays }: Props) {
  const { t } = useTranslation()

  const matrix = useMemo(
    () => contextByFamily(entries, contextCodes, familyCodes),
    [entries, contextCodes, familyCodes],
  )

  // Les contextes les plus fournis en premier : on lit le tableau du haut vers le bas.
  // « Non renseigné » ferme la marche, ce n'est pas un domaine de vie.
  const rows = useMemo<CrossRow[]>(() => {
    const built = matrix.contextCodes.map(contextCode => ({
      contextCode,
      counts: matrix.familyCodes.map(familyCode => matrix.cells[contextCode][familyCode]),
      total: matrix.rowTotals[contextCode],
    }))
    return built.sort((a, b) => {
      if (a.contextCode === CONTEXT_NONE) return 1
      if (b.contextCode === CONTEXT_NONE) return -1
      return b.total - a.total
    })
  }, [matrix])

  // Total de la table = saisies portant une famille. On somme les marges de COLONNE et
  // non les cellules : une saisie qui déclare deux domaines compte dans deux lignes,
  // les marges de ligne ne s'additionnent donc pas au total. Les colonnes, si.
  const tableTotal = useMemo(
    () => matrix.familyCodes.reduce((sum, code) => sum + matrix.columnTotals[code], 0),
    [matrix],
  )

  const columns = useMemo<DataTableColumn<CrossRow>[]>(() => [
    {
      id: 'context',
      header: t('emotion_naming.crosstab_context'),
      headerClassName: 'enx__th-context',
      cellClassName: 'enx__td-context',
      cell: row => (row.contextCode === CONTEXT_NONE
        ? t('emotion_naming.crosstab_none')
        : t(row.contextCode)),
    },
    ...matrix.familyCodes.map((familyCode, index) => ({
      id: familyCode,
      header: t(familyCode),
      headerClassName: 'enx__th-count',
      cellClassName: 'enx__td-count',
      cell: (row: CrossRow) => {
        const count = row.counts[index]
        // Une case vide ne rend RIEN : l'absence de saisie est du contenu.
        if (count === 0) return null
        return (
          <span className="enx__cell">
            <span
              className="enx__fill"
              aria-hidden="true"
              // Calcul dynamique ponctuel : l'opacité vient du comptage de la cellule.
              style={{ opacity: densityOpacity(count) }}
            />
            <span className="enx__count">{count}</span>
          </span>
        )
      },
    })),
    {
      id: 'total',
      header: t('emotion_naming.crosstab_total'),
      headerClassName: 'enx__th-total',
      cellClassName: 'enx__td-total',
      cell: row => row.total,
    },
  ], [matrix.familyCodes, t])

  if (entries.length < CROSSTAB_MIN_ENTRIES) {
    return (
      <p className="enx__too-few" data-testid="crosstab-too-few">
        {t('emotion_naming.crosstab_too_few', { count: entries.length, days: rangeDays })}
      </p>
    )
  }

  return (
    <div className="enx" data-testid="crosstab">
      <DataTable
        className="enx__table"
        rows={rows}
        columns={columns}
        getRowId={row => row.contextCode}
        ariaLabel={t('emotion_naming.crosstab_aria')}
        footer={(
          <tr data-testid="crosstab-column-totals">
            <th scope="row" className="enx__td-context">
              {t('emotion_naming.crosstab_column_total')}
            </th>
            {matrix.familyCodes.map(familyCode => (
              <td key={familyCode} className="enx__td-count">
                {matrix.columnTotals[familyCode]}
              </td>
            ))}
            <td className="enx__td-total">{tableTotal}</td>
          </tr>
        )}
      />

      <p className="enx__recap" data-testid="crosstab-recap">
        {matrix.wordlessCount > 0
          ? t('emotion_naming.crosstab_wordless_line', {
              count: matrix.wordlessCount,
              total: matrix.total,
            })
          : t('emotion_naming.crosstab_total_line', { total: matrix.total })}
      </p>

      <div className="enx__legend">
        <p className="enx__legend-text">{t('emotion_naming.crosstab_legend')}</p>
        <div className="enx__scale" aria-label={t('emotion_naming.crosstab_scale_label')}>
          {DENSITY_STEPS.map(step => (
            <span
              key={step}
              className="enx__scale-step"
              aria-hidden="true"
              style={{ opacity: densityOpacity(step) }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
