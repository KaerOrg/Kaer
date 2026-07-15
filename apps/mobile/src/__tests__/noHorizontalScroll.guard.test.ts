// ─── Garde-fou anti-régression — zéro scroll horizontal accidentel (mobile) ──────
//
// Règle : aucun écran / vue / carte mobile ne défile horizontalement. Le contenu
// s'adapte TOUJOURS à la largeur de l'appareil. Le SEUL défilement horizontal
// légitime est un carrousel / pager explicitement voulu (swipe de photos, pager de
// fiches), borné à son conteneur et n'entraînant jamais le débordement de l'écran.
// Convention : .claude/rules/coding-standards.md § « Zéro scroll horizontal (mobile) ».
//
// Ce test cible la CAUSE la plus fréquente d'un scroll horizontal réel en React
// Native : une prop `horizontal` posée sur un ScrollView / FlatList / FlashList.
// Chaque usage doit être un carrousel ASSUMÉ, inscrit dans l'allowlist ci-dessous
// (chemin relatif à apps/mobile/src). Toute nouvelle prop `horizontal` hors
// allowlist échoue le test → l'auteur tranche : carrousel voulu (→ l'ajouter, avec
// justification) ou débordement accidentel (→ le supprimer, layout fluide).
//
// Note : les débordements de LAYOUT (largeur figée, `row` sans flexShrink) ne créent
// pas de scroll en RN — le contenu est rogné/compressé, pas défilable. Seule une vue
// scrollable `horizontal` rend l'écran glissable ; c'est donc le vecteur verrouillé
// ici. Les autres causes restent couvertes par la revue (règle coding-standards).

import { readFileSync, readdirSync, statSync } from 'fs'
import { join, relative } from 'path'

// __dirname = apps/mobile/src/__tests__
const SRC_DIR = join(__dirname, '..')

// Carrousels / pagers intentionnels — chacun justifié. Chemin relatif à src/.
const HORIZONTAL_ALLOWLIST = new Set<string>([
  // Diaporama plein écran : swipe horizontal paginé entre photos, borné à la modale
  // (jamais l'écran d'app). Carrousel assumé.
  'components/ui/PhotoCarousel/PhotoCarousel.tsx',
])

// `horizontal` en tant que prop JSX : le token suivi de `=`, d'une fin de ligne, d'un
// autre prop, ou de `>`/`/>`. Le `(?![A-Za-z])` évite « horizontale(s) » de la prose.
const HORIZONTAL_PROP_RE = /(?:^|[\s<])horizontal(?![A-Za-z])/

// Ligne purement commentaire (prose du type « axe horizontal », « swipe horizontal »).
const COMMENT_LINE_RE = /^\s*(\/\/|\/\*|\*|\{\/\*)/

function walk(dir: string): string[] {
  const out: string[] = []
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) {
      if (name === 'node_modules' || name === '__mocks__') continue
      out.push(...walk(p))
    } else if (name.endsWith('.tsx') && !name.includes('.test.')) {
      out.push(p)
    }
  }
  return out
}

interface Violation {
  file: string
  line: number
  detail: string
}

describe('garde-fou — zéro scroll horizontal accidentel (mobile)', () => {
  it('toute prop `horizontal` est un carrousel assumé de l’allowlist', () => {
    const violations: Violation[] = []
    for (const file of walk(SRC_DIR)) {
      const rel = relative(SRC_DIR, file).split('\\').join('/')
      if (HORIZONTAL_ALLOWLIST.has(rel)) continue
      const lines = readFileSync(file, 'utf8').split('\n')
      lines.forEach((raw, i) => {
        if (COMMENT_LINE_RE.test(raw)) return // prose, pas du JSX
        const code = raw.split('//')[0] // ignore un commentaire de fin de ligne
        if (HORIZONTAL_PROP_RE.test(code)) {
          violations.push({
            file: rel,
            line: i + 1,
            detail:
              'prop `horizontal` hors allowlist — carrousel voulu ? l’inscrire (avec justification) dans HORIZONTAL_ALLOWLIST ; sinon supprimer (layout fluide, largeur adaptée à l’écran)',
          })
        }
      })
    }
    expect(violations).toEqual([])
  })
})
