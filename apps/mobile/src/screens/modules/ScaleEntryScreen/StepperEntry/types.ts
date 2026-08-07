import type { LikertOption } from '../../../../components/features/ModuleRenderer/fields/widgets/LikertWidget'

/**
 * Ce dont le parcours a besoin d'une fonction de traduction, et rien de plus.
 *
 * Le `TFunction` complet d'i18next est un type surchargé qu'un test ne peut satisfaire
 * sans casser le typage ; et ces composants n'ont besoin que de « une clé, des
 * paramètres, une chaîne ». Un contrat étroit se satisfait structurellement, par le
 * vrai `t` en runtime comme par une fonction de test.
 */
export type Translate = (key: string, params?: Record<string, unknown>) => string

/** Un item du questionnaire, déjà résolu en libellés affichables. */
export interface StepperQuestion {
  id: string
  label: string
  options: readonly LikertOption[]
}

/**
 * Étape courante du parcours. Union discriminée plutôt que deux états parallèles
 * (`index` + `showReview`) : « être sur un item » et « être sur la relecture » sont
 * mutuellement exclusifs, un état mixte ne doit pas être représentable.
 *
 * `fromReview` retient qu'un item a été ouvert DEPUIS la relecture, pour que le
 * retour y ramène au lieu de reculer d'un item : le patient corrige une réponse et
 * retrouve sa vue d'ensemble.
 */
export type StepperStep =
  | { kind: 'item'; index: number; fromReview: boolean }
  | { kind: 'review' }
