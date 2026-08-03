// Agrégats du module « Nommer ce que je ressens » (ex roue des émotions), côté
// praticien. Fonctions PURES, sans I/O ni traduction : le service lit, ces fonctions
// comptent, les composants traduisent.
//
// ─── Conformité MDR 2017/745 : ce que ce fichier ne fera jamais ────────────────
//
// Ce module ne produit pas de série numérique mais une CATÉGORIE (famille · nuance ·
// mot), une profondeur de choix, un contexte et un texte libre. On s'interdit donc :
//
//   · tout « score de granularité émotionnelle ». L'indice canonique de
//     différenciation est un ICC calculé sur PLUSIEURS termes notés à la MÊME
//     occasion. Ce module en enregistre un seul par saisie : l'ICC n'est pas
//     calculable, et aucune transformation ne le rendra calculable ;
//   · tout indice d'émodiversité (entropie de Shannon) : formule inapplicable à un
//     jeu d'items fermé et à une échelle bornée, effets publiés attribués à des
//     artefacts statistiques. Un indice contesté dans son principe n'a rien à faire
//     dans un dossier de soin ;
//   · toute moyenne d'intensité toutes familles confondues — elle mélangerait la
//     joie et la honte ;
//   · toute tendance, flèche, comparaison automatique ou projection.
//
// Ce qui reste, et qui est licite : des COMPTAGES DESCRIPTIFS. La limite reconnue de
// la méthode ICC est justement qu'elle ne teste pas le postulat central de la théorie
// (une différenciation faible se traduit par des termes généraux plutôt que précis).
// Notre arbre EST cette mesure, par construction : le patient s'arrête où il peut.

/** Une saisie, telle que lue par le service (identités opaques, non traduites). */
export interface EmotionNamingEntry {
  /** Horodatage de la saisie (ISO). */
  date: string
  /** Clés i18n du chemin : famille, nuance, mot. `null` quand le niveau est absent. */
  familyCode: string | null
  nuanceCode: string | null
  wordCode: string | null
  intensity: number | null
  /** Codes i18n des domaines de contexte déclarés. */
  context: string[]
  /** Contexte libre saisi par le patient, hors i18n. */
  contextOther: string | null
  notes: string | null
}

/**
 * Jusqu'où le patient est allé dans l'arbre.
 *
 * `'nuance'` couvre AUSSI le cas d'une nuance qui ne porte aucun mot au choix : le
 * patient qui écrit « Solitude » est allé au bout de ce que l'arbre propose. Compter
 * ce cas comme « mot précis » gonflerait artificiellement la profondeur pour 16
 * nuances sur 37 (décision du 2026-07-29, ticket #262).
 */
export type NamingDepth = 'none' | 'family' | 'nuance' | 'word'

export function depthOf(entry: EmotionNamingEntry): NamingDepth {
  if (entry.wordCode) return 'word'
  if (entry.nuanceCode) return 'nuance'
  if (entry.familyCode) return 'family'
  return 'none'
}

export interface DepthCounts {
  none: number
  family: number
  nuance: number
  word: number
}

/** Les quatre comptes de profondeur. Des effectifs bruts, aucune proportion. */
export function depthCounts(entries: EmotionNamingEntry[]): DepthCounts {
  const counts: DepthCounts = { none: 0, family: 0, nuance: 0, word: 0 }
  for (const entry of entries) counts[depthOf(entry)] += 1
  return counts
}

/** Taxonomie de référence, lue en base : jamais de dénominateur figé dans le code. */
export interface NamingTaxonomy {
  families: string[]
  /** Codes de nuances, groupés par code de famille. */
  nuancesByFamily: Record<string, string[]>
  /** Codes de mots précis, groupés par code de nuance. */
  wordsByNuance: Record<string, string[]>
  /** Tous les codes de mots précis de l'arbre. */
  words: string[]
  /**
   * Teinte de chaque famille, telle que posée en base. Elle sert de FILET et de fond
   * très pâle, jamais de couleur de texte : ces pastels échouent AA en petit corps.
   * C'est une identité de famille, jamais une gravité clinique (MDR).
   */
  colorByFamily: Record<string, string>
}

export interface RepertoireCell {
  nuanceCode: string
  count: number
}

export interface RepertoireRow {
  familyCode: string
  /** Total de la famille : somme de ses nuances employées, jamais une moyenne. */
  total: number
  cells: RepertoireCell[]
}

export interface Repertoire {
  rows: RepertoireRow[]
  /** Effectifs de couverture : « n familles sur 8 », « n nuances sur 37 »… */
  familiesUsed: number
  familiesTotal: number
  nuancesUsed: number
  nuancesTotal: number
  wordsUsed: number
  wordsTotal: number
}

/** Niveau affiché par la matrice : les nuances, ou les mots précis. */
export type RepertoireLevel = 'nuance' | 'word'

/**
 * Matrice du répertoire : une ligne par famille, une cellule par nuance, y compris
 * celles jamais employées (`count: 0`). Ce vide est le propos de l'écran : il montre
 * de quoi le patient n'arrive jamais à parler. Il n'est donc pas filtré.
 *
 * Au niveau `'word'`, les cellules deviennent les mots précis de la famille : mêmes
 * règles, même absence de filtrage.
 */
export function repertoire(
  entries: EmotionNamingEntry[],
  taxonomy: NamingTaxonomy,
  level: RepertoireLevel = 'nuance',
): Repertoire {
  const nuanceHits = new Map<string, number>()
  const wordCounts = new Map<string, number>()
  const familyHits = new Set<string>()
  const wordHits = new Set<string>()
  for (const entry of entries) {
    if (entry.familyCode) familyHits.add(entry.familyCode)
    if (entry.nuanceCode) nuanceHits.set(entry.nuanceCode, (nuanceHits.get(entry.nuanceCode) ?? 0) + 1)
    if (entry.wordCode) {
      wordHits.add(entry.wordCode)
      wordCounts.set(entry.wordCode, (wordCounts.get(entry.wordCode) ?? 0) + 1)
    }
  }

  const rows = taxonomy.families.map(familyCode => {
    const nuanceCodes = taxonomy.nuancesByFamily[familyCode] ?? []
    const cells = level === 'nuance'
      ? nuanceCodes.map(nuanceCode => ({ nuanceCode, count: nuanceHits.get(nuanceCode) ?? 0 }))
      : nuanceCodes.flatMap(nuanceCode =>
          (taxonomy.wordsByNuance[nuanceCode] ?? [])
            .map(wordCode => ({ nuanceCode: wordCode, count: wordCounts.get(wordCode) ?? 0 })))
    return {
      familyCode,
      total: cells.reduce((sum, cell) => sum + cell.count, 0),
      cells,
    }
  })

  const nuancesTotal = Object.values(taxonomy.nuancesByFamily)
    .reduce((sum, list) => sum + list.length, 0)

  return {
    rows,
    familiesUsed: familyHits.size,
    familiesTotal: taxonomy.families.length,
    nuancesUsed: [...nuanceHits.keys()].length,
    nuancesTotal,
    wordsUsed: wordHits.size,
    wordsTotal: taxonomy.words.length,
  }
}

export interface ContextMatrix {
  /** Codes de contexte en lignes, dans l'ordre reçu, plus « non renseigné ». */
  contextCodes: string[]
  familyCodes: string[]
  /** `cells[contextCode][familyCode]` : effectif brut. */
  cells: Record<string, Record<string, number>>
  rowTotals: Record<string, number>
  columnTotals: Record<string, number>
  /** Saisies sans famille : hors matrice, comptées à part et rappelées sous elle. */
  wordlessCount: number
  /** Total de la fenêtre, matrice + sans mot : la somme doit toujours retomber. */
  total: number
}

/** Marqueur des saisies dont aucun domaine de contexte n'a été déclaré. */
export const CONTEXT_NONE = '__none__'

/**
 * Croisement contexte × famille. Les saisies sans émotion nommée sont EXCLUES de la
 * matrice (elles n'ont pas de famille) et comptées à part : les diluer dans une
 * colonne inventée fabriquerait une catégorie que le patient n'a pas choisie.
 */
export function contextByFamily(
  entries: EmotionNamingEntry[],
  contextCodes: string[],
  familyCodes: string[],
): ContextMatrix {
  const rows = [...contextCodes, CONTEXT_NONE]
  const cells: Record<string, Record<string, number>> = {}
  const rowTotals: Record<string, number> = {}
  const columnTotals: Record<string, number> = {}
  for (const row of rows) {
    cells[row] = {}
    rowTotals[row] = 0
    for (const family of familyCodes) cells[row][family] = 0
  }
  for (const family of familyCodes) columnTotals[family] = 0

  let wordlessCount = 0
  for (const entry of entries) {
    if (!entry.familyCode) { wordlessCount += 1; continue }
    if (!familyCodes.includes(entry.familyCode)) continue
    // Une saisie peut déclarer plusieurs domaines : elle compte dans chacun. Les
    // marges lignes ne s'additionnent donc pas au total, c'est attendu.
    const declared = entry.context.filter(code => contextCodes.includes(code))
    const targets = declared.length > 0 ? declared : [CONTEXT_NONE]
    for (const row of targets) {
      cells[row][entry.familyCode] += 1
      rowTotals[row] += 1
    }
    columnTotals[entry.familyCode] += 1
  }

  return {
    contextCodes: rows,
    familyCodes,
    cells,
    rowTotals,
    columnTotals,
    wordlessCount,
    total: entries.length,
  }
}

/** Nœud d'arbre tel que renvoyé par le moteur de modules (forme minimale utile ici). */
export interface TaxonomyField {
  id: string
  field_type: string
  text_code: string | null
  props?: Record<string, string>
  children?: TaxonomyField[]
}

/**
 * Construit la taxonomie de référence depuis les `module_content_fields` du module.
 *
 * Les dénominateurs affichés (« sur 8 », « sur 37 », « sur 58 ») en sortent : ils
 * suivent le seed et ne sont JAMAIS écrits en dur. Un élagage de l'arbre se répercute
 * donc tout seul sur l'écran praticien.
 */
export function buildNamingTaxonomy(fields: TaxonomyField[]): NamingTaxonomy {
  const roots = fields.filter(f => f.field_type === 'tree_node')
  const families: string[] = []
  const nuancesByFamily: Record<string, string[]> = {}
  const wordsByNuance: Record<string, string[]> = {}
  const colorByFamily: Record<string, string> = {}
  const words: string[] = []

  for (const family of roots) {
    if (!family.text_code) continue
    families.push(family.text_code)
    if (family.props?.color) colorByFamily[family.text_code] = family.props.color
    const nuances: string[] = []
    for (const nuance of family.children ?? []) {
      if (nuance.field_type !== 'tree_node' || !nuance.text_code) continue
      nuances.push(nuance.text_code)
      const nuanceWords: string[] = []
      for (const word of nuance.children ?? []) {
        if (word.field_type === 'tree_node' && word.text_code) {
          nuanceWords.push(word.text_code)
          words.push(word.text_code)
        }
      }
      wordsByNuance[nuance.text_code] = nuanceWords
    }
    nuancesByFamily[family.text_code] = nuances
  }

  return { families, nuancesByFamily, wordsByNuance, words, colorByFamily }
}

/**
 * Borne haute de l'échelle d'intensité, lue dans la config du module.
 *
 * Jamais figée dans le code : le passage de 1-10 à 1-5 côté patient doit se refléter
 * ici sans redéploiement. Les anciennes saisies gardent leur valeur d'origine, qui
 * n'est jamais recalculée (règle d'or : on stocke et on restitue, on n'interprète pas).
 */
export function readIntensityMax(fields: TaxonomyField[], fallback = 5): number {
  const config = fields.find(f => f.field_type === 'tree_selector_config')
  const raw = config?.props?.intensity_max
  const parsed = raw != null ? Number.parseInt(raw, 10) : Number.NaN
  return Number.isNaN(parsed) ? fallback : parsed
}

/**
 * Restreint à une fenêtre de N jours glissants. Découpage de LECTURE, pas fenêtre
 * d'analyse : rien n'est comparé d'une fenêtre à l'autre.
 */
export function filterByRange(
  entries: EmotionNamingEntry[],
  days: number,
  now: Date,
): EmotionNamingEntry[] {
  const floor = now.getTime() - days * 24 * 60 * 60 * 1000
  return entries.filter(entry => new Date(entry.date).getTime() >= floor)
}
