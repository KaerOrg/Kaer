import type { ModuleType } from '@kaer/shared'
import {
  DEMO_PREFIX,
  isTestAccount,
  type DemoContext,
  type DemoGenerator,
  type DemoResult,
} from './types'
import { sleepDiaryDemoGenerator } from './sleepDiaryDemoGenerator'

/**
 * Registre des générateurs de démo, indexé par ModuleType. Un module rejoint ce
 * registre le jour où son générateur de 2 mois est écrit (règle module-builder :
 * « un module n'est pas terminé sans son générateur de démo »).
 */
const GENERATORS: Partial<Record<ModuleType, DemoGenerator>> = {
  sleep_diary: sleepDiaryDemoGenerator,
}

/** Modules disposant d'un générateur de démo (alimente l'écran développeur). */
export function availableDemoModules(): ModuleType[] {
  return Object.keys(GENERATORS) as ModuleType[]
}

/**
 * Génère les données de démo d'un module. VERROU DE SÛRETÉ : refuse toute
 * génération hors compte de test — fabriquer des données de santé dans un vrai
 * dossier patient serait une faute RGPD/clinique. Cette garde est la barrière
 * réelle ; l'UI ne fait que masquer l'accès.
 */
export async function generateDemoForModule(
  module: ModuleType,
  ctx: DemoContext,
): Promise<DemoResult> {
  if (!isTestAccount(ctx.patientEmail)) return { ok: false, reason: 'not_test_account' }
  const generator = GENERATORS[module]
  if (!generator) return { ok: false, reason: 'unknown_module' }
  const count = await generator.generate()
  return { ok: true, count }
}

/**
 * Purge les entrées de démo d'un générateur. INVARIANT DE SÛRETÉ CENTRAL : ne
 * supprime que les `local_id` préfixés `demo-`. Ce filtre vit ici, une seule
 * fois, pour qu'aucun générateur ne puisse par erreur supprimer une donnée
 * réelle (jamais préfixée). Chaque suppression passe par le service réel du
 * module (→ syncDelete → suppression locale + propagation serveur par l'outbox).
 */
async function purgeGenerator(generator: DemoGenerator): Promise<number> {
  const demoIds = (await generator.listEntryIds()).filter((id) => id.startsWith(DEMO_PREFIX))
  for (const id of demoIds) {
    await generator.deleteEntry(id)
  }
  return demoIds.length
}

/**
 * Purge toutes les entrées de démo de tous les modules enregistrés. Refuse hors
 * compte de test, comme la génération.
 */
export async function purgeAllDemo(ctx: DemoContext): Promise<DemoResult> {
  if (!isTestAccount(ctx.patientEmail)) return { ok: false, reason: 'not_test_account' }
  let total = 0
  for (const generator of Object.values(GENERATORS)) {
    if (!generator) continue
    total += await purgeGenerator(generator)
  }
  return { ok: true, count: total }
}
