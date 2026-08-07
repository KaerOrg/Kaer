import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

// ─── Garde-fou : la citation des auteurs ne disparaît pas (#417, Q-13) ───────
//
// La citation des auteurs est une **condition de la licence** du PHQ-9, pas un
// ornement. Elle vivait jusqu'ici accrochée à d'autres contenus : le pied d'une fiche,
// une note sur l'item 9. Il suffisait d'y déplacer ou d'y reformuler un bloc, geste
// anodin en apparence, pour qu'elle disparaisse sans que personne ne s'en aperçoive.
//
// Une obligation contractuelle ne doit pas dépendre d'un élément qui existe pour une
// autre raison, ni de la vigilance d'un relecteur. Ce test est le seul filet : il
// échoue si un écran qui AFFICHE LES ITEMS de l'instrument ne rend pas la mention.
// C'est un manquement contractuel qu'il attrape, pas un défaut cosmétique.
//
// Modèle suivi : `hiddenModules.guard.test.ts`, qui fait le même travail pour les
// droits de reproduction.

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(here, '..', '..', '..', '..')

/**
 * Écrans EXCLUS, avec leur raison. La saisie ne porte pas la mention : un pied de page
 * juridique sous chaque question ajoute du bruit là où l'attention doit être sur
 * l'item, et l'obligation est satisfaite par une mention visible ailleurs dans le
 * module, pas par une répétition à chaque écran.
 */
const EXEMPT = [
  'apps/mobile/src/screens/modules/ScaleEntryScreen',
  'apps/mobile/src/components/features/ModuleRenderer/layouts/Questionnaire',
]

/** Marqueurs d'un rendu des items de l'instrument. */
const RENDERS_ITEMS = /'scale_question'/
/** Marqueurs d'un rendu de la mention de source. */
const RENDERS_CITATION = /SourceCitation|readScaleSource/

/**
 * Seuls les `.tsx` sont inspectés : ce qui est en cause est la **diffusion** des items
 * à un humain, et un module `.ts` ne rend rien (le JSX impose l'extension `.tsx` dans
 * ce projet). Un helper pur qui nomme `scale_question` pour trier des fields n'est pas
 * une surface de diffusion, et l'inscrire en exemption reviendrait à user l'exemption
 * jusqu'à ce qu'elle couvre un vrai écran.
 */
function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) { walk(full, out); continue }
    if (/\.tsx$/.test(entry) && !/\.test\.tsx$/.test(entry)) out.push(full)
  }
  return out
}

/** Fichiers qui rendent les items, séparés en conformes et fautifs. */
function scan(): { itemFiles: string[]; offenders: string[] } {
  const roots = [join(repoRoot, 'apps', 'web', 'src'), join(repoRoot, 'apps', 'mobile', 'src')]
  const itemFiles: string[] = []
  const offenders: string[] = []
  for (const root of roots) {
    for (const file of walk(root)) {
      const rel = file.slice(repoRoot.length + 1).replace(/\\/g, '/')
      const content = readFileSync(file, 'utf8')
      if (!RENDERS_ITEMS.test(content)) continue
      itemFiles.push(rel)
      if (EXEMPT.some(prefix => rel.startsWith(prefix))) continue
      if (!RENDERS_CITATION.test(content)) offenders.push(rel)
    }
  }
  return { itemFiles, offenders }
}

describe('mention de source : garde-fou (#417)', () => {
  it('le scanner voit bien des écrans (sanity check)', () => {
    // Un garde-fou qui n'inspecte rien passe toujours. Si ce test tombe, c'est que le
    // marqueur a changé (renommage de `scale_question`, extraction dans une constante)
    // et que la garde ne protège plus personne.
    expect(scan().itemFiles.length).toBeGreaterThan(0)
  })

  it('tout écran qui affiche les items de l\'instrument rend la mention', () => {
    expect(
      scan().offenders,
      'ces fichiers rendent les items sans la citation des auteurs, ce qui est un manquement à la licence',
    ).toEqual([])
  })

  it('la citation est bien en base, et distincte de la recommandation clinique', () => {
    const seed = readFileSync(join(repoRoot, 'supabase', 'seed', 'scale_meta_seed.sql'), 'utf8')
    const citation = /\('phq9\.scale_meta',\s*'instrument_citation',\s*'([^']*(?:''[^']*)*)'\)/.exec(seed)
    expect(citation, 'instrument_citation du phq9 absent du seed').not.toBeNull()
    expect(citation?.[1]).toContain('Kroenke')
    // La recommandation NICE ne s'empile pas dans la citation : l'une est une
    // obligation de licence, l'autre un argument de crédibilité.
    expect(citation?.[1]).not.toContain('NICE')
  })

  it('le seed du scale_meta reste rejoué au déploiement', () => {
    const manifest = readFileSync(join(repoRoot, 'supabase', 'SEED_MANIFEST.json'), 'utf8')
    expect(manifest).toContain('seed/scale_meta_seed.sql')
  })
})
