// ─── Helpers de lecture des `field_props` ────────────────────────────────────
//
// `field_props` est une table de config EAV : PK `(field_id, prop_key)`, donc
// UNE seule `prop_value` (atomique) par prop. Une liste ne se packe jamais dans
// une string (CSV/JSON) : elle s'éclate en clés indexées `base_1`, `base_2`, …
// Ce module fournit la lecture inverse, partagée web ≡ mobile.

/**
 * Collecte les valeurs des clés indexées `base_1`, `base_2`, … d'un jeu de
 * props, triées par index numérique croissant. Tolère les trous (ne collecte
 * que les index présents). Retourne `[]` si aucune clé `base_N` n'existe.
 *
 * @example collectIndexed({ duration_1: '5', duration_2: '15' }, 'duration') → ['5', '15']
 */
export function collectIndexed(props: Record<string, string>, base: string): string[] {
  const prefix = `${base}_`
  const matched: Array<{ index: number; value: string }> = []
  for (const [key, value] of Object.entries(props)) {
    if (!key.startsWith(prefix)) continue
    const suffix = key.slice(prefix.length)
    if (!/^\d+$/.test(suffix)) continue
    matched.push({ index: Number(suffix), value })
  }
  matched.sort((a, b) => a.index - b.index)
  return matched.map(m => m.value)
}
