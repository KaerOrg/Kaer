import type { ContentField } from '@services/moduleService'

/**
 * Posture de l'accueil du module vis-à-vis du score (#408).
 *
 * - `inline` (défaut) : total en tête de chaque passation, plus la courbe d'évolution.
 *   Comportement historique, conservé par défaut : une échelle qui n'a rien demandé ne
 *   doit pas changer d'apparence dans le dos de son module.
 * - `collapsed` : la liste ne montre que des dates ; les totaux vivent sous un dépli
 *   replié, et la courbe disparaît. Le score reste accessible, il n'est plus imposé.
 *
 * C'est une CONFIGURATION, au même titre que le mode de saisie : `ScaleHistoryScreen`
 * et `EntryCard` sont partagés par les neuf modules d'échelle, un test sur
 * l'identifiant du module y serait une violation bloquante.
 */
export type ScoreDisplay = 'inline' | 'collapsed'

const DEFAULT_SCORE_DISPLAY: ScoreDisplay = 'inline'

/**
 * Lit `scale_meta.score_display`. Toute valeur absente ou inconnue retombe sur le
 * comportement historique : une configuration erronée n'efface pas des informations
 * que l'écran affichait jusque-là.
 */
export function readScoreDisplay(fields: readonly ContentField[] | null): ScoreDisplay {
  const raw = fields?.find(f => f.field_type === 'scale_meta')?.props['score_display']
  return raw === 'collapsed' || raw === 'inline' ? raw : DEFAULT_SCORE_DISPLAY
}
