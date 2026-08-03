// ─── Synthèse du plan de sécurité pour la carte du module (PW-2) ────────────
//
// Ne reste ici que ce que la CARTE affiche. L'édition, elle, vit dans
// `SafetyPlanEditorPanel`, qui possède ses propres lectures et mutations : un panneau
// d'édition n'a pas besoin qu'un hook de page lui pré-mâche sa donnée.
//
// ── Ce que « personnalisé » veut dire, et ce qu'il ne veut plus dire ────────
//
// Le drapeau se calculait sur `practitioner_message` : trois mots dans un champ
// suffisaient à afficher « Plan personnalisé » sur une carte dont le plan était VIDE.
// C'était le problème d'origine du ticket #321. Il se calcule maintenant sur le contenu
// réel du plan : au moins un item écrit, d'un côté ou de l'autre.
//
// MDR 2017/745 : c'est une PRÉSENCE, pas une évaluation. Aucun seuil (« au moins trois
// étapes »), aucun taux, aucun jugement sur la qualité de ce qui est écrit.

import { useQuery } from '@tanstack/react-query'
import { crisisQueries } from '../../../hooks/queries'
import type { PatientModule } from '../../../lib/database.types'

export function useCrisisPlanSummary(patientId: string, modules: PatientModule[]) {
  const itemsQuery = useQuery(crisisQueries.planItems(patientId))

  const unlocked = modules.some(m => m.module_type === 'crisis_plan')
  const isConfigured = unlocked && (itemsQuery.data?.length ?? 0) > 0

  return { isConfigured }
}
