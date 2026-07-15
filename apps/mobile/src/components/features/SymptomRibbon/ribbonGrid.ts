import type { ScaleEntry } from '../../../lib/database'

// ─── Construction de la grille du ruban multi-symptômes (logique pure) ───────
//
// Grille = N dimensions (lignes) × jours du mois (colonnes). Pour chaque jour,
// on lit la valeur brute de la dimension dans la dernière saisie de ce jour.
// Jour non renseigné → null (cellule vide à contour clair, JAMAIS une valeur
// inventée — MDR 2017/745). Aucune interprétation : magnitude brute seulement.

export interface RibbonRow {
  readonly key: string
  /** Une entrée par jour du mois (index 0 = 1er). null = jour non renseigné. */
  readonly values: (number | null)[]
}

export interface RibbonGrid {
  readonly daysInMonth: number
  readonly rows: RibbonRow[]
  /** Nombre de jours du mois comportant au moins une saisie. */
  readonly filledDays: number
}

/** Jour local (1..31) d'un horodatage ISO, sur l'année/mois demandés, sinon null. */
function localDayInMonth(iso: string, year: number, month: number): number | null {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  if (d.getFullYear() !== year || d.getMonth() !== month) return null
  return d.getDate()
}

/**
 * @param entries       saisies brutes (toutes dates)
 * @param dimensionKeys dimensions à afficher, dans l'ordre des lignes
 * @param year          année affichée
 * @param month         mois affiché (0 = janvier)
 */
export function buildRibbonGrid(
  entries: readonly ScaleEntry[],
  dimensionKeys: readonly string[],
  year: number,
  month: number,
): RibbonGrid {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const rows: RibbonRow[] = dimensionKeys.map(key => ({
    key,
    values: new Array<number | null>(daysInMonth).fill(null),
  }))
  const dayFilled = new Array<boolean>(daysInMonth).fill(false)

  // Les entrées sont supposées triées récent→ancien (getAllScaleEntries) ; on
  // itère de l'ancien au récent pour que la DERNIÈRE saisie d'un jour l'emporte.
  for (let i = entries.length - 1; i >= 0; i--) {
    const entry = entries[i]
    const day = localDayInMonth(entry.created_at, year, month)
    if (day == null) continue
    const col = day - 1
    dayFilled[col] = true
    const subs = entry.subscale_scores
    if (subs == null) continue
    for (let r = 0; r < dimensionKeys.length; r++) {
      const raw = subs[dimensionKeys[r]]
      rows[r].values[col] = typeof raw === 'number' ? raw : null
    }
  }

  return { daysInMonth, rows, filledDays: dayFilled.filter(Boolean).length }
}
