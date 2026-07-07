import { buildColumnSpecs, type ColumnSpec } from '@kaer/shared'
import type { FormEntryRow } from '@services/engagementService'

// Helpers purs de la vue praticien des modules `column_form`. La structure des
// colonnes (titres, couleurs, curseurs) est dérivée de `module_content_fields`
// (config-first, source unique web ≡ mobile via `@kaer/shared`). Le SIGNAL
// CLINIQUE du DTR de Beck (mouvement de restructuration avant→après) est propre
// à `beck_columns` (seul module `column_form`), au même titre que
// `fetchBeckEvolution`. Conformité MDR 2017/745 : valeurs brutes uniquement,
// aucun seuil, label interprétatif ni couleur de jugement (les couleurs codent
// l'identité de colonne, jamais une gravité).

export { buildColumnSpecs, type ColumnSpec }

/**
 * Une paire de curseurs « avant → après » restituant le mouvement de
 * restructuration mesuré par les colonnes de Beck (analyse praticien).
 * La couleur d'accent est dérivée de la config du curseur `beforeKey`
 * (identité de colonne), jamais figée ici.
 */
export interface BeckMovement {
  readonly beforeKey: string
  readonly afterKey: string
  readonly titleCode: string
  readonly beforeCode: string
  readonly afterCode: string
}

// Deux mouvements du DTR : intensité émotionnelle et niveau de croyance.
export const BECK_MOVEMENTS: readonly BeckMovement[] = [
  {
    beforeKey: 'emotion_intensity',
    afterKey: 'outcome_intensity',
    titleCode: 'evolution.beck_move_intensity_title',
    beforeCode: 'evolution.beck_move_before',
    afterCode: 'evolution.beck_move_after',
  },
  {
    beforeKey: 'thought_belief',
    afterKey: 'outcome_belief',
    titleCode: 'evolution.beck_move_belief_title',
    beforeCode: 'evolution.beck_move_belief_before',
    afterCode: 'evolution.beck_move_belief_after',
  },
]

// Clé du texte d'émotion, affichée en légende du mouvement d'intensité (sidebar).
export const BECK_EMOTION_KEY = 'emotion'

// Clés déjà restituées par les cartes de mouvement : masquées dans la grille de
// colonnes pour éviter la redite (les valeurs brutes n'apparaissent qu'une fois).
export const SUMMARIZED_KEYS: ReadonlySet<string> = new Set(
  BECK_MOVEMENTS.flatMap(m => [m.beforeKey, m.afterKey]),
)

/** Coercition numérique tolérante (le payload opaque relaie string|number). */
function toNum(value: string | number | undefined): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value)
    return Number.isFinite(n) ? n : null
  }
  return null
}

export interface MovementValues {
  before: number | null
  after: number | null
  /** Différence brute après - avant (score calculé pour le praticien), ou null. */
  delta: number | null
}

/** Valeurs brutes avant/après d'un mouvement pour une fiche (aucun seuil). */
export function readMovement(entry: FormEntryRow, movement: BeckMovement): MovementValues {
  const before = toNum(entry.values[movement.beforeKey])
  const after = toNum(entry.values[movement.afterKey])
  const delta = before != null && after != null ? after - before : null
  return { before, after, delta }
}

/** Vrai si la fiche porte au moins une valeur d'un mouvement (affiche les cartes). */
export function hasAnyMovement(entry: FormEntryRow): boolean {
  return BECK_MOVEMENTS.some(m => {
    const { before, after } = readMovement(entry, m)
    return before != null || after != null
  })
}

/** Couleur d'accent d'un curseur depuis la config (identité de colonne), ou null. */
export function findSliderColor(columns: ColumnSpec[], key: string): string | null {
  for (const col of columns) {
    for (const child of col.children) {
      if (child.field_type === 'column_slider_field' && child.props['key'] === key) {
        return child.props['color'] ?? null
      }
    }
  }
  return null
}

/** Date métier locale (ISO horodaté) formatée en toutes lettres selon la locale. */
export function formatEntryDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale, { dateStyle: 'long' })
}

/** Date courte (jour + mois) pour la liste latérale des saisies. */
export function formatEntryDateShort(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'long' })
}
