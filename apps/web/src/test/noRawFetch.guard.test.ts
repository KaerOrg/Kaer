import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, relative } from 'node:path'

// ─── Garde-fou anti-régression — zéro appel API dupliqué (issue #101) ─────────
//
// Le client Supabase ne cache RIEN : la déduplication vient uniquement du passage
// par React Query avec une `queryKey` canonique (factory `hooks/queries/`). Deux
// failles la cassent, ce test les rend mécaniques :
//   (a) une lecture de service (`fetch*`) importée et appelée DIRECTEMENT dans un
//       composant/page → re-fetch à chaque montage, hors cache ;
//   (b) une `queryKey` écrite EN DUR (`['x', 'y']`) hors `hooks/queries/` → clé
//       divergente = React Query ne déduplique plus.
// Convention : docs/services.md + .claude/rules/coding-standards.md § Accès aux données.

const here = dirname(fileURLToPath(import.meta.url))
const srcDir = join(here, '..') // apps/web/src
const SCAN_DIRS = [join(srcDir, 'components'), join(srcDir, 'pages')]

// (a) Un import de lecture est un symbole `fetch*` importé d'un service. Les écritures
// (`create*`/`update*`/`delete*`/`save*`…) restent légitimes pour `useMutation` ; les
// `import type` ne sont pas des appels. On cible donc les imports VALEUR `fetch*` depuis
// un module `services/`.
const SERVICE_IMPORT_RE =
  /import\s+(?!type\b)([^;]*?)\s+from\s+'((?:@services\/|(?:\.\.\/)+services\/)[^']+)'/gs
const READ_SYMBOL_RE = /^fetch[A-Z]/

// Exceptions légitimes (lecture par service hors React Query, NON dup-prone) — chacune
// justifiée. Ce ne sont pas des re-fetch au montage :
const READ_ALLOWLIST = new Set<string>([
  // Notes de dossier chargées paresseusement par ligne dépliée, injectées en callback
  // (`onLoadNotes`) — pas un fetch au montage (cf. #100, pattern ObservationBlock).
  'fetchCaseloadNotes',
  // Amorçage de formulaire à l'ouverture d'un éditeur (state local éditable), one-shot
  // sur action utilisateur — même pattern que useCrisisPlanEditor.openEditor.
  'fetchTrackedEffects',
  'fetchMedications',
  // Idem : activités co-construites (useBAActivitiesEditor.openEditor).
  'fetchBAActivities',
])

// (b) Les invalidations doivent référencer `xxxQueries.y(...).queryKey` (ou un prefix
// exposé par la factory). Un `queryKey:` suivi d'un littéral tableau est interdit hors
// des factories.
const INLINE_QUERYKEY_RE = /queryKey:\s*\[/

function walk(dir: string): string[] {
  const out: string[] = []
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) {
      if (name === 'queries') continue // les factories sont la SEULE source de clés
      out.push(...walk(p))
    } else if (/\.tsx?$/.test(name) && !name.includes('.test.')) {
      out.push(p)
    }
  }
  return out
}

function scanFiles(): string[] {
  return SCAN_DIRS.flatMap(walk)
}

interface Violation { file: string; line: number; detail: string }

describe('garde-fou — zéro appel API dupliqué (#101)', () => {
  it('(a) aucune lecture de service (fetch*) appelée hors React Query', () => {
    const violations: Violation[] = []
    for (const file of scanFiles()) {
      const src = readFileSync(file, 'utf8')
      for (const m of src.matchAll(SERVICE_IMPORT_RE)) {
        const symbols = m[1].match(/[A-Za-z0-9_]+/g) ?? []
        for (const sym of symbols) {
          if (READ_SYMBOL_RE.test(sym) && !READ_ALLOWLIST.has(sym)) {
            const line = src.slice(0, m.index ?? 0).split('\n').length
            violations.push({
              file: relative(srcDir, file),
              line,
              detail: `importe la lecture "${sym}" d'un service — doit passer par une factory hooks/queries + useQuery`,
            })
          }
        }
      }
    }
    expect(violations, JSON.stringify(violations, null, 2)).toEqual([])
  })

  it('(b) aucune queryKey littérale hors hooks/queries', () => {
    const violations: Violation[] = []
    for (const file of scanFiles()) {
      const lines = readFileSync(file, 'utf8').split('\n')
      lines.forEach((text, i) => {
        if (INLINE_QUERYKEY_RE.test(text)) {
          violations.push({
            file: relative(srcDir, file),
            line: i + 1,
            detail: 'queryKey littérale — référencer xxxQueries.y(...).queryKey (ou un prefix exposé par la factory)',
          })
        }
      })
    }
    expect(violations, JSON.stringify(violations, null, 2)).toEqual([])
  })
})
