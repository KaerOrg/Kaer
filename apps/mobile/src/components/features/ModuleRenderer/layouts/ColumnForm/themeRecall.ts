// ─── themeRecall — réassurance par thème (#118), helpers purs ────────────────
//
// Le module beck_columns laisse le patient attacher un THÈME libre à sa
// situation (clé `situation_theme`). Ces helpers, purs et sans I/O, servent à :
//   • lister les thèmes qu'il a déjà employés (chips de rappel),
//   • retrouver ses colonnes passées portant le MÊME thème,
//   • lire la config `column_form_config` du bloc réassurance,
//   • dériver les libellés/couleurs des champs ré-affichés depuis les colonnes.
//
// Conformité MDR 2017/745 : aucun jugement, aucune inférence sémantique. La
// « similarité » est une simple égalité d'étiquette DÉCLARÉE par le patient : le
// code filtre, il ne conclut pas. Le contenu ré-affiché est son propre texte
// brut, jamais reformulé.

import { collectIndexed } from '@kaer/shared'
import { colors } from '@theme'

/** Fiche minimale nécessaire au rappel (structurellement compatible `FormEntry`). */
export interface ThemeEntry {
  id: string
  values: Record<string, string | number>
  created_at: string
}

/** Colonne minimale nécessaire pour dériver les libellés ré-affichés. */
export interface RecallColumn {
  header: { text_code: string | null; props: Record<string, string> }
  children: ReadonlyArray<{ field_type: string; text_code: string | null; props: Record<string, string> }>
}

/** Champ ré-affiché dans l'encart réassurance : clé + libellé + couleur + unité. */
export interface RecallField {
  key: string
  /** Code i18n du libellé (titre de colonne pour un texte, libellé du curseur pour un slider). */
  labelCode: string
  /** Couleur d'identité de la colonne (jamais une gravité clinique — MDR). */
  color: string
  /** Unité affichée après une valeur numérique (ex. « % »), sinon ''. */
  unit: string
}

/** Config du bloc réassurance, lue depuis `column_form_config`. `null` si absente. */
export interface ReassuranceConfig {
  themeKey: string
  chipsLabelCode: string
  titleCode: string
  hintCode: string
  recallKeys: string[]
}

// Regex hoistée au niveau module : réutilisée à chaque normalisation (évite une
// réallocation de RegExp par appel — normalizeTheme est le workhorse du feature).
const WHITESPACE = /\s+/g

/** Normalise un thème pour la comparaison : trim + minuscules + espaces compactés. */
export function normalizeTheme(value: string | number | undefined | null): string {
  return String(value ?? '').trim().toLowerCase().replace(WHITESPACE, ' ')
}

/** Thème brut (casse d'origine, trimé) porté par une fiche. */
function rawTheme(entry: ThemeEntry, themeKey: string): string {
  return String(entry.values[themeKey] ?? '').trim()
}

/**
 * Lit la config réassurance depuis les props de `column_form_config`.
 * Retourne `null` si `theme_key` n'est pas défini (module sans réassurance :
 * craving_journal, chronobiology… n'activent pas le bloc).
 */
export function readReassuranceConfig(
  configProps: Record<string, string> | undefined,
): ReassuranceConfig | null {
  const themeKey = configProps?.['theme_key']
  if (!configProps || !themeKey) return null
  return {
    themeKey,
    chipsLabelCode: configProps['theme_chips_label'] ?? '',
    titleCode: configProps['reassurance_title'] ?? '',
    hintCode: configProps['reassurance_hint'] ?? '',
    recallKeys: collectIndexed(configProps, 'reassurance_key'),
  }
}

/**
 * Thèmes distincts déjà employés par le patient : casse d'origine, du plus
 * récent au plus ancien, dédupliqués par forme normalisée. Servent de chips de
 * rappel (le patient réutilise ses propres étiquettes → matching fiable).
 * `entries` est supposé trié anti-chronologiquement (cf. `getAllFormEntries`).
 */
export function distinctThemes(
  entries: readonly ThemeEntry[],
  themeKey: string,
  limit = 8,
): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const entry of entries) {
    const raw = rawTheme(entry, themeKey)
    if (raw === '') continue
    const norm = normalizeTheme(raw)
    if (seen.has(norm)) continue
    seen.add(norm)
    out.push(raw)
    if (out.length >= limit) break
  }
  return out
}

/**
 * Fiches passées portant le MÊME thème que `currentTheme`, du plus récent au
 * plus ancien, en excluant la fiche en cours d'édition (`excludeId`). Retourne
 * `[]` si le thème courant est vide (aucun rappel tant qu'aucun thème n'est
 * déclaré). Simple égalité d'étiquette normalisée — aucune inférence (MDR).
 */
export function matchEntriesByTheme(
  entries: readonly ThemeEntry[],
  themeKey: string,
  currentTheme: string,
  excludeId?: string | null,
): ThemeEntry[] {
  const target = normalizeTheme(currentTheme)
  if (target === '') return []
  return entries.filter(
    entry => entry.id !== excludeId && normalizeTheme(entry.values[themeKey]) === target,
  )
}

/**
 * Dérive, pour chaque clé ré-affichée, son libellé + sa couleur depuis la config
 * des colonnes du module (réutilise les intitulés déjà en base, zéro clé i18n en
 * double). Libellé = titre de colonne pour un champ texte, libellé propre du
 * curseur pour un slider. Les clés introuvables sont ignorées.
 */
export function buildRecallFields(
  columns: readonly RecallColumn[],
  recallKeys: readonly string[],
): RecallField[] {
  const out: RecallField[] = []
  for (const key of recallKeys) {
    for (const col of columns) {
      const child = col.children.find(c => c.props['key'] === key)
      if (!child) continue
      const isSlider = child.field_type === 'column_slider_field'
      out.push({
        key,
        labelCode: (isSlider ? child.text_code : col.header.text_code) ?? '',
        color: col.header.props['color'] ?? colors.primary,
        unit: child.props['unit'] ?? '',
      })
      break
    }
  }
  return out
}
