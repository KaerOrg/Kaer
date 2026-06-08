// Helpers de lecture du payload brut de la dernière saisie d'un module
// (présentation pour ModuleSummaryPanel). Conforme MDR : coercition défensive
// vers number, restitution brute, aucune interprétation clinique.

export type SummaryDimension = { key: string; value: number }

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value)
    if (Number.isFinite(n)) return n
  }
  return undefined
}

/** Valeurs brutes par dimension (`payload.subscale_scores`) — trackers multi-dimensions. */
export function readDimensions(payload: Record<string, unknown> | null): SummaryDimension[] {
  if (!payload) return []
  const subs = payload.subscale_scores
  if (subs == null || typeof subs !== 'object') return []
  const out: SummaryDimension[] = []
  for (const [key, raw] of Object.entries(subs as Record<string, unknown>)) {
    const value = toNumber(raw)
    if (value != null) out.push({ key, value })
  }
  return out
}

/** Score total brut (`payload.total_score`) — échelles cliniques. */
export function readTotalScore(payload: Record<string, unknown> | null): number | null {
  if (!payload) return null
  return toNumber(payload.total_score) ?? null
}
