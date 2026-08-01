import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

// ─── Garde-fou anti-régression : modules masqués (issue #247) ────────────────
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
// Réactivation légitime d'une échelle : retirer son id de `MUST_BE_HIDDEN` **et**
// de la liste du seed, dans le même commit, avec la preuve du droit obtenu.

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(here, '..', '..', '..', '..')

const seedSql = readFileSync(join(repoRoot, 'supabase', 'seed.sql'), 'utf8')
const schemaSql = readFileSync(join(repoRoot, 'supabase', 'schema.sql'), 'utf8')
const catalogService = readFileSync(
  join(repoRoot, 'apps', 'web', 'src', 'services', 'moduleCatalogService.ts'),
  'utf8',
)

/** Échelles sans droit de reproduction commerciale établi. Voir issue #247. */
const MUST_BE_HIDDEN = ['asrs18', 'epds', 'snap_iv', 'rcads', 'nsi', 'bsl23'] as const

/** Contenu de la liste `id in (...)` de l'instruction de masquage du seed. */
function seededHiddenIds(): string[] {
  const stmt = /set\s+is_hidden\s*=\s*\(\s*id\s+in\s*\(([^)]*)\)\s*\)/i.exec(seedSql)
  if (!stmt) return []
  return [...stmt[1].matchAll(/'([^']+)'/g)].map(m => m[1])
}

describe('modules masqués : garde-fou (#247)', () => {
  it('le schéma porte la colonne is_hidden', () => {
    expect(schemaSql).toMatch(/is_hidden\s+boolean\s+not null\s+default false/)
  })

  it('le seed contient bien une instruction de masquage (sanity check du parseur)', () => {
    expect(seededHiddenIds().length).toBeGreaterThan(0)
  })

  it('les échelles sans droits acquis sont toutes masquées dans le seed', () => {
    const hidden = new Set(seededHiddenIds())
    const missing = MUST_BE_HIDDEN.filter(id => !hidden.has(id))
    expect(missing, `échelles non masquées dans supabase/seed.sql : ${missing.join(', ')}`).toEqual([])
  })

  it('asrs6 reste visible : son régime de licence est distinct de celui d\'asrs18', () => {
    expect(seededHiddenIds()).not.toContain('asrs6')
  })

  it('les lectures de catalogue filtrent sur is_hidden', () => {
    // Trois lectures partent de la table `modules` : catalogue praticien,
    // invitation, ids coming_soon. Chacune doit écarter les modules masqués.
    const filters = catalogService.match(/\.eq\('is_hidden', false\)/g) ?? []
    expect(filters.length).toBeGreaterThanOrEqual(3)
  })
})
