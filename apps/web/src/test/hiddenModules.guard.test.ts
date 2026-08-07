import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

// ─── Garde-fou anti-régression : modules en veille (issues #247 et #406) ─────
//
// Kær est un produit commercial : plusieurs échelles reproduisent des items dont
// nous n'avons pas le droit de reproduction dans ce cadre. Elles ne sont pas
// supprimées (items, i18n, scoring, écrans et tests restent en place) mais
// retirées de l'app par `modules.is_hidden`.
//
// Ce test échoue si l'une d'elles réapparaît : seed modifié, refonte du catalogue,
// ou service de lecture qui oublierait le filtre. Le but est que la CI casse au
// lieu que des items protégés repartent en production.
//
// #406 : une seconde famille de modules est en veille, pour un motif SANS RAPPORT,
// le périmètre de la bêta (`gad7`, `asrs6`), dont les droits sont acquis. Le
// garde-fou doit donc distinguer les deux : il verrouille la liste des DROITS, et
// vérifie seulement que la liste du périmètre existe et ne se mélange pas à l'autre.
// Confondre les deux ferait annoncer au praticien une question de licence devant une
// échelle libre, ce qui est faux.
//
// Réactivation légitime d'une échelle sous droits : retirer son id de `MUST_BE_HIDDEN`
// **et** de la liste du seed, dans le même commit, avec la preuve du droit obtenu.
// Réactivation d'une échelle de périmètre : retirer son id du seed, rien d'autre.

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(here, '..', '..', '..', '..')

const seedSql = readFileSync(join(repoRoot, 'supabase', 'seed.sql'), 'utf8')
const schemaSql = readFileSync(join(repoRoot, 'supabase', 'schema.sql'), 'utf8')
const catalogService = readFileSync(
  join(repoRoot, 'apps', 'web', 'src', 'services', 'moduleCatalogService.ts'),
  'utf8',
)

/**
 * Échelles sans droit de reproduction commerciale établi (#247). Cette liste est le
 * coeur du garde-fou : un id qui en sort sans preuve juridique renvoie des items
 * protégés en production. Elle ne contient QUE des motifs de droits.
 */
const MUST_BE_HIDDEN = ['asrs18', 'epds', 'snap_iv', 'rcads', 'nsi', 'bsl23'] as const

/** Échelles en veille pour cause de périmètre bêta (#406) : droits acquis. */
const BETA_SCOPE = ['gad7', 'asrs6'] as const

/**
 * Ids listés dans l'instruction de mise en veille du seed, pour un motif donné.
 * Lit la branche `when id in (...) then '<motif>'` du `case`.
 */
function seededIdsForReason(reason: 'rights' | 'beta_scope'): string[] {
  const branch = new RegExp(`when\\s+id\\s+in\\s*\\(([^)]*)\\)\\s*then\\s*'${reason}'`, 'i').exec(seedSql)
  if (!branch) return []
  return [...branch[1].matchAll(/'([^']+)'/g)].map(m => m[1])
}

describe('modules en veille : garde-fou (#247, #406)', () => {
  it('le schéma porte les colonnes is_hidden et hidden_reason', () => {
    expect(schemaSql).toMatch(/is_hidden\s+boolean\s+not null\s+default false/)
    expect(schemaSql).toMatch(/hidden_reason\s+text/)
  })

  it('le schéma interdit un masquage sans motif, et un motif sans masquage', () => {
    // Sans cette contrainte, les deux colonnes peuvent diverger et la zone « En
    // veille » du praticien afficherait une ligne sans raison, ou une raison
    // fantôme sur un module visible.
    expect(schemaSql).toContain('modules_hidden_reason_ck')
    expect(schemaSql).toMatch(/hidden_reason\s+in\s*\(\s*'rights',\s*'beta_scope'\s*\)/)
  })

  it('le seed contient bien les deux listes (sanity check du parseur)', () => {
    expect(seededIdsForReason('rights').length).toBeGreaterThan(0)
    expect(seededIdsForReason('beta_scope').length).toBeGreaterThan(0)
  })

  it('les échelles sans droits acquis sont toutes en veille pour motif de droits', () => {
    const hidden = new Set(seededIdsForReason('rights'))
    const missing = MUST_BE_HIDDEN.filter(id => !hidden.has(id))
    expect(missing, `échelles non masquées dans supabase/seed.sql : ${missing.join(', ')}`).toEqual([])
  })

  it('asrs6 et gad7 ne sont JAMAIS rangés sous un motif de droits', () => {
    // Leurs régimes de licence sont distincts de ceux des échelles protégées :
    // l'ASRS 6 items est autorisé par NYU en usage commercial, et le GAD-7 est libre
    // au même titre que le PHQ-9. Ils sont en veille par décision de périmètre.
    const rights = seededIdsForReason('rights')
    for (const id of BETA_SCOPE) expect(rights).not.toContain(id)
  })

  it('asrs6 et gad7 sont en veille pour motif de périmètre bêta', () => {
    const beta = new Set(seededIdsForReason('beta_scope'))
    const missing = BETA_SCOPE.filter(id => !beta.has(id))
    expect(missing, `échelles hors périmètre non mises en veille : ${missing.join(', ')}`).toEqual([])
  })

  it('is_hidden est dérivé du motif, jamais porté par une seconde liste', () => {
    // Deux listes indépendantes divergeraient : un id retiré d'une seule laisserait un
    // module masqué sans motif, ou un motif sans masquage.
    expect(seedSql).toMatch(/is_hidden\s*=\s*\(\s*r\.reason\s+is not null\s*\)/)
  })

  it('les lectures de catalogue filtrent sur is_hidden', () => {
    // Trois lectures partent de la table `modules` : catalogue praticien,
    // invitation, ids coming_soon. Chacune doit écarter les modules masqués.
    const filters = catalogService.match(/\.eq\('is_hidden', false\)/g) ?? []
    expect(filters.length).toBeGreaterThanOrEqual(3)
  })

  it('la base refuse d\'assigner un module en veille, pas seulement l\'interface', () => {
    // Le filtre du catalogue est un confort d'interface : la barrière réelle est le
    // trigger, sans quoi une assignation par un autre chemin remettrait le module
    // chez le patient. Comportement couvert par supabase/tests/hiddenModuleAssignment.test.ts.
    expect(schemaSql).toContain('fn_guard_hidden_module_assignment')
    expect(schemaSql).toMatch(/create trigger trg_guard_hidden_module_assignment/)
  })
})
