// Helpers purs du parcours d'exposition — zéro dépendance React/RN, testables seuls.
//
// MDR 2017/745 : ces fonctions ne font que trier / projeter des valeurs brutes
// saisies par le patient. Aucune interprétation, aucun seuil, aucune conclusion.

import type { FearEntry, FearSituation } from '../../../../../lib/database'
import type { SudsPoint } from '../../../../ui/Chart'

/** Marches classées du moins → plus angoissant (SUDS cible croissant). */
export function sortSteps(situations: readonly FearSituation[]): FearSituation[] {
  return situations.slice().sort((a, b) => {
    const ta = a.target_suds ?? Number.POSITIVE_INFINITY
    const tb = b.target_suds ?? Number.POSITIVE_INFINITY
    if (ta !== tb) return ta - tb
    return a.created_at.localeCompare(b.created_at)
  })
}

export function entriesForStep(entries: readonly FearEntry[], stepId: string): FearEntry[] {
  return entries.filter(e => e.situation_id === stepId)
}

export function sessionCount(entries: readonly FearEntry[], stepId: string): number {
  return entriesForStep(entries, stepId).length
}

/** Score représentatif d'une séance pour la courbe : pic en priorité, repli final puis début. */
export function sessionScore(e: FearEntry): number {
  return e.suds_peak ?? e.suds_after ?? e.suds_before
}

/** Série temporelle (pic au fil des séances) d'une marche, triée par date croissante. */
export function peakSeries(entries: readonly FearEntry[], stepId: string): SudsPoint[] {
  return entriesForStep(entries, stepId)
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(e => ({ score: sessionScore(e), date: e.date }))
}

/** Dernier score enregistré (séance la plus récente) d'une marche, ou null. */
export function lastSessionScore(entries: readonly FearEntry[], stepId: string): number | null {
  const series = peakSeries(entries, stepId)
  return series.length > 0 ? series[series.length - 1].score : null
}

/** Échelle de valeurs SUDS discrètes [min, max] par pas de `step`. */
export function buildSudsSteps(min: number, max: number, step: number): number[] {
  const out: number[] = []
  for (let v = min; v <= max; v += step) out.push(v)
  return out
}

/** Sérialise les stratégies sélectionnées (ids de fields) + texte libre. */
export function serializeStrategies(selectedKeys: readonly string[], custom: string | null): string {
  return JSON.stringify({ selected: selectedKeys, custom: custom ?? '' })
}

export function deserializeStrategies(raw: string): { selected: string[]; custom: string } {
  try {
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return { selected: [], custom: '' }
    const obj = parsed as { selected?: unknown; custom?: unknown }
    const selected = Array.isArray(obj.selected) ? obj.selected.map(String) : []
    const custom = typeof obj.custom === 'string' ? obj.custom : ''
    return { selected, custom }
  } catch {
    return { selected: [], custom: '' }
  }
}
