// Configuration générique de graphiques — réutilisable par n'importe quel graphe
// de l'app, sans dépendance à un domaine métier. Les presets propres aux modules
// cliniques (bornes d'échelles, dimensions d'humeur…) vivent à côté de leur
// feature et consomment cette palette.

export type TimeRange = '1m' | '3m' | '6m' | '1y'

export const RANGE_DAYS: Record<TimeRange, number> = { '1m': 30, '3m': 90, '6m': 180, '1y': 365 }
export const TIME_RANGES: readonly TimeRange[] = ['1m', '3m', '6m', '1y']

// Palette de séries : couleurs distinctes, assez nombreuses pour des graphes
// multi-séries. À utiliser via `colorAt` pour des séries dynamiques.
export const CHART_PALETTE = [
  '#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899',
  '#3B82F6', '#0EA5E9', '#F97316', '#DC2626', '#7C3AED', '#0891B2',
  '#64748B',
] as const

export const DEFAULT_CHART_COLOR = CHART_PALETTE[0]

/** Couleur de la i-ème série — cycle la palette (gère les index négatifs). */
export function colorAt(index: number): string {
  const len = CHART_PALETTE.length
  return CHART_PALETTE[((index % len) + len) % len]
}

/** Filtre des points datés sur une fenêtre glissante de `days` jours. */
export function filterByRange<T extends { date: string }>(points: T[], days: number): T[] {
  const cutoff = Date.now() - days * 86_400_000
  return points.filter(p => new Date(p.date).getTime() >= cutoff)
}
