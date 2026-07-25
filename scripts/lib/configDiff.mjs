// Cœur PUR de l'audit de dérive config seed ↔ base (ticket #203, critères 3 & 5).
//
// Méthode robuste voulue par le ticket : « c'est Postgres qui rejoue les fichiers,
// pas un parsing regex fragile ». On compare donc deux jeux de lignes déjà extraits
// de deux bases : une base fraîchement seedée depuis les fichiers (source de vérité)
// et la base cible (prod). Ce module ne fait AUCUNE I/O : il diffe des tableaux
// d'objets. L'extraction SQL vit dans scripts/audit-drift.mjs.

// Tables de config auditées. La clé DOIT être stable et définie par le seed
// (surrogate uuid gen_random_uuid() exclu : non comparable d'une base à l'autre).
//   - psyedu_topics : clé naturelle (module_key, topic_key), portée par une
//     contrainte unique (cf. ON CONFLICT (module_key, topic_key) des seeds).
// EXCLUES volontairement (documenté, pas de limite silencieuse) :
//   - psyedu_blocks   : id uuid non systématiquement fixé par les seeds
//     (psyedu_seed.sql insère sans id) → pas de clé stable inter-bases.
//   - module_sources  : id uuid aléatoire, pas de clé naturelle évidente.
//   - jonctions pures (module_tags, psyedu_topic_tags, module_topics) : peu
//     dup-prone (DO NOTHING légitime), hors périmètre de dérive de valeur.
export const CONFIG_TABLES = [
  { table: 'module_categories', keyColumns: ['id'] },
  { table: 'modules', keyColumns: ['id'] },
  { table: 'module_content_fields', keyColumns: ['id'] },
  { table: 'field_props', keyColumns: ['field_id', 'prop_key'] },
  { table: 'tag_dimensions', keyColumns: ['id'] },
  { table: 'tags', keyColumns: ['id'] },
  // created_at (default now()) diffère entre la base seed fraîche et la cible :
  // colonne volatile ignorée, sinon chaque ligne serait signalée « dérive » à tort.
  { table: 'psyedu_topics', keyColumns: ['module_key', 'topic_key'], ignore: ['created_at'] },
]

function keyOf(row, keyColumns) {
  return JSON.stringify(keyColumns.map((c) => row[c] ?? null))
}

// Sérialise une ligne de façon déterministe (clés triées) pour comparer le contenu.
// `ignore` retire les colonnes volatiles (ex. created_at default now()), qui
// diffèrent d'une base à l'autre sans être une vraie dérive de config.
function normalize(row, ignore) {
  const out = {}
  for (const col of Object.keys(row).sort()) {
    if (!ignore.includes(col)) out[col] = row[col]
  }
  return JSON.stringify(out)
}

// Diffe une table entre la base seed (référence) et la base cible.
//   missing → présent dans le seed, absent de la cible (donnée jamais déployée)
//   extra   → présent dans la cible, absent du seed (orpheline potentielle)
//   changed → même clé, contenu divergent (dérive silencieuse — le cœur du ticket)
export function diffTable({ table, keyColumns, ignore = [] }, seedRows, targetRows) {
  const seedMap = new Map(seedRows.map((r) => [keyOf(r, keyColumns), r]))
  const targetMap = new Map(targetRows.map((r) => [keyOf(r, keyColumns), r]))
  const missing = []
  const changed = []
  for (const [k, seedRow] of seedMap) {
    const targetRow = targetMap.get(k)
    if (targetRow === undefined) {
      missing.push(seedRow)
    } else if (normalize(seedRow, ignore) !== normalize(targetRow, ignore)) {
      changed.push({ key: k, seed: seedRow, target: targetRow })
    }
  }
  const extra = []
  for (const [k, targetRow] of targetMap) {
    if (!seedMap.has(k)) extra.push(targetRow)
  }
  return { table, missing, extra, changed }
}

/** True dès qu'un résultat de table porte au moins un écart (missing/extra/changed). */
export function hasDrift(results) {
  return results.some((r) => r.missing.length > 0 || r.extra.length > 0 || r.changed.length > 0)
}
