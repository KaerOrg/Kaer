import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

// ─── Garde-fou : les libellés du PHQ-9 ne bougent pas (#407, Q-3) ───────────
//
// Les libellés du PHQ-9 étaient une traduction maison d'origine inconnue et non
// tracée : un seul item sur neuf correspondait à une version publiée. Ce n'est pas
// tenable pour un produit commercial, où l'on doit pouvoir dire d'où viennent les mots
// affichés et à quel titre on a le droit de les afficher.
//
// L'app emploie désormais la version française OFFICIELLE, « French for France »,
// publiée sur phqscreeners.com. Le document porte lui-même « La reproduction, la
// traduction, l'affichage ou la distribution de ce document sont autorisés » : il n'y
// a donc aucun ayant droit tiers, contrairement à la traduction MAPI distribuée par
// eProvide, qui reste hors de portée. La référence est `docs/instruments/phq9.md`.
//
// Ce garde-fou a deux rôles :
//
//   1. Empêcher la dérive. Changer un libellé change les réponses : la valeur de
//      l'instrument tient à ce qu'une passation se compare à elle-même dans le temps,
//      avec les mêmes mots. Une retouche est une rupture de série, pas une correction
//      rédactionnelle : elle doit passer par le fichier de référence, consciemment.
//   2. Tenir la parité. Les quatre fichiers de locale (deux apps × deux langues) sont
//      comparés à la MÊME source : le patient et le praticien lisent le même texte.

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(here, '..', '..', '..', '..')

type Bundle = Record<string, string>

/** Bloc JSON de référence extrait de `docs/instruments/phq9.md`. */
function readReference(): { en: Bundle; fr: Bundle } {
  const doc = readFileSync(join(repoRoot, 'docs', 'instruments', 'phq9.md'), 'utf8')
  // `\r?` : git restitue le fichier en CRLF sur un poste Windows, en LF en CI.
  // Sans cette tolérance, le garde-fou passe en CI et échoue sur la machine du dev.
  const fence = /```json\r?\n([\s\S]*?)\r?\n```/.exec(doc)
  if (!fence) throw new Error('bloc json de référence introuvable dans docs/instruments/phq9.md')
  return JSON.parse(fence[1]) as { en: Bundle; fr: Bundle }
}

function readLocale(app: 'web' | 'mobile', lang: 'fr' | 'en'): Bundle {
  const raw = readFileSync(
    join(repoRoot, 'apps', app, 'src', 'i18n', 'locales', lang, 'common.json'),
    'utf8',
  )
  const parsed = JSON.parse(raw) as { modules?: Record<string, Bundle> }
  return parsed.modules?.phq9 ?? {}
}

const REFERENCE = readReference()
const SURFACES = [
  { app: 'mobile', lang: 'fr' },
  { app: 'mobile', lang: 'en' },
  { app: 'web', lang: 'fr' },
  { app: 'web', lang: 'en' },
] as const

describe('PHQ-9 : conformité au fichier de référence (#407)', () => {
  it('la référence porte les dix items, les quatre modalités et la consigne', () => {
    // Sanity check du parseur : un bloc vide ferait passer tous les tests suivants.
    for (const lang of ['en', 'fr'] as const) {
      const bundle = REFERENCE[lang]
      expect(bundle.instructions_1).toBeTruthy()
      expect(bundle.instructions_2).toBeTruthy()
      for (let i = 1; i <= 10; i++) expect(bundle[`q${i}`], `q${i} (${lang})`).toBeTruthy()
      for (let i = 0; i <= 3; i++) {
        expect(bundle[`opt_${i}`], `opt_${i} (${lang})`).toBeTruthy()
        expect(bundle[`q10_opt_${i}`], `q10_opt_${i} (${lang})`).toBeTruthy()
      }
    }
  })

  for (const { app, lang } of SURFACES) {
    it(`${app} / ${lang} : chaque libellé est identique caractère pour caractère`, () => {
      const locale = readLocale(app, lang)
      const reference = REFERENCE[lang]
      const actual: Bundle = {}
      for (const key of Object.keys(reference)) actual[key] = locale[key]
      expect(actual).toEqual(reference)
    })
  }

  it('le fichier de référence porte ses auteurs, sa provenance et la source anglaise', () => {
    const doc = readFileSync(join(repoRoot, 'docs', 'instruments', 'phq9.md'), 'utf8')
    expect(doc).toContain('Kroenke, Spitzer & Williams, 2001')
    expect(doc).toMatch(/French for France/)
    // L'URL du document source : sans elle, « version officielle » n'est qu'une
    // affirmation, et personne ne peut vérifier les mots affichés.
    expect(doc).toContain('phqscreeners.com')
  })

  it('le document source est accessible au praticien depuis l\'app', () => {
    // La provenance ne sert à rien si elle reste dans le dépôt : le praticien doit
    // pouvoir ouvrir le PDF d'où viennent les libellés qu'il propose à son patient.
    const seed = readFileSync(join(repoRoot, 'supabase', 'seed', 'sources_seed.sql'), 'utf8')
    expect(seed).toContain('PHQ9_French%20for%20France.pdf')
  })

  it('la fiche destinée au soignant dit quelle version française est employée', () => {
    // Elle disait « traduction Kær, non validée » : c'est devenu faux le jour où l'app
    // est passée à la version officielle. Une limite qu'on assume doit rester exacte.
    const fr = JSON.parse(
      readFileSync(join(repoRoot, 'apps', 'web', 'src', 'i18n', 'locales', 'fr', 'common.json'), 'utf8'),
    ) as { scales?: { descriptions?: Record<string, string> } }
    const description = fr.scales?.descriptions?.phq9 ?? ''
    expect(description).toContain('French for France')
    expect(description).not.toContain('Traduction Kær')
    // La limite qui subsiste porte sur l'instrument en français, pas sur la traduction.
    expect(description).toContain('INESSS')
  })

  it('aucun contenu psychométrique n\'est surchargé dans teen.json', () => {
    // Une échelle validée ne se reformule pas, pas même pour la tutoyer. Le mode ado
    // retombe sur `common` par le fallback i18next.
    const PSYCHOMETRIC = /^(q\d+(_opt_\d+)?|opt_\d+|instructions_\d+)$/
    for (const lang of ['fr', 'en'] as const) {
      const teen = JSON.parse(
        readFileSync(
          join(repoRoot, 'apps', 'mobile', 'src', 'i18n', 'locales', lang, 'teen.json'),
          'utf8',
        ),
      ) as { modules?: Record<string, Bundle> }
      const keys = Object.keys(teen.modules?.phq9 ?? {}).filter(k => PSYCHOMETRIC.test(k))
      expect(keys, `clés psychométriques dans ${lang}/teen.json`).toEqual([])
    }
  })

  it('reference_label reste une référence de recommandation, pas une citation d\'auteurs', () => {
    // L'attribution est traitée de bout en bout par Q-13 : on n'empile pas la citation
    // des auteurs sur un champ qui porte une recommandation clinique.
    const seed = readFileSync(join(repoRoot, 'supabase', 'seed', 'scale_meta_seed.sql'), 'utf8')
    const line = /\('phq9\.scale_meta',\s*'reference_label',\s*'([^']*(?:''[^']*)*)'\)/.exec(seed)
    expect(line, 'reference_label du phq9 introuvable dans le seed').not.toBeNull()
    expect(line?.[1]).toContain('NICE NG222')
    expect(line?.[1]).not.toContain('Kroenke')
  })
})
