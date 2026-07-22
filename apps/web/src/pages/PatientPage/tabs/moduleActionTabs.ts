import type { ModuleType } from '../../../lib/database.types'
import type { ModuleActionTab } from './ModuleActionsModal'

/**
 * Modules dont l'aperçu praticien n'apparaît qu'une fois le module déverrouillé
 * (leur carte ne montre le bouton Aperçu que dans cet état).
 */
const PREVIEW_REQUIRES_UNLOCK: ReadonlySet<ModuleType> = new Set([
  'crisis_plan',
  'medication_side_effects',
  'medication_adherence',
  'behavioral_activation',
  'chronobiology_tracker',
])

/**
 * Modules sans panneau Données ni Notifications : outils de configuration/lecture
 * pure côté praticien (aucune série de saisies patient exploitable en graphique, pas
 * de routine de rappel câblée).
 */
const NO_DATA_NO_NOTIF: ReadonlySet<ModuleType> = new Set([
  'psychoeducation',
  'crisis_plan',
  'rim',
])

/**
 * Modules dont la configuration EST le geste de déverrouillage (le formulaire crée le
 * module) : l'onglet Config est donc disponible même verrouillé (mode « unlock »).
 */
const CONFIG_UNLOCK_GESTURE: ReadonlySet<ModuleType> = new Set([
  'rim',
  'psychoeducation',
])

/**
 * Modules dont la configuration n'est éditable qu'une fois le module déverrouillé.
 */
const CONFIG_AFTER_UNLOCK: ReadonlySet<ModuleType> = new Set([
  'crisis_plan',
  'medication_side_effects',
  'medication_adherence',
  'behavioral_activation',
  'cognitive_saturation',
])

export interface ModuleTabContext {
  /** Le module est déverrouillé pour ce patient (row `patient_modules` existe). */
  unlocked: boolean
  /** Le module est une échelle clinique (présent dans `scale_meta`). */
  isScale: boolean
  /** L'échelle expose un aperçu (pertinent uniquement si `isScale`). */
  scaleHasPreview: boolean
}

/**
 * Onglets disponibles dans la modale d'actions d'un module, dans l'ordre canonique
 * Données → Configuration → Notifications → Sources → Vue patient. Reproduit la
 * disponibilité des boutons de carte : Données/Notifications n'existent qu'une fois le
 * module déverrouillé et hors modules de configuration pure (psychoédu, plan de crise,
 * RIM) ; l'aperçu suit `hasPreview` pour les échelles et l'état déverrouillé pour
 * certaines familles. `rim` n'a aucun onglet en dehors de sa configuration.
 */
export function computeModuleTabs(type: ModuleType, ctx: ModuleTabContext): ModuleActionTab[] {
  const tabs: ModuleActionTab[] = []

  // Aperçu (« Vue patient ») + Sources : mêmes conditions de disponibilité.
  let hasPreview: boolean
  if (ctx.isScale) hasPreview = ctx.scaleHasPreview
  else if (type === 'rim') hasPreview = false
  else if (PREVIEW_REQUIRES_UNLOCK.has(type)) hasPreview = ctx.unlocked
  else hasPreview = true

  // Ordre d'affichage : Données → Configuration → Notifications → Vue patient → Sources.

  // Données (en tête)
  if (ctx.unlocked && !NO_DATA_NO_NOTIF.has(type)) tabs.push('data')

  // Configuration : rim/psycho (le formulaire crée le module) même verrouillé ;
  // crisis/médication/BA une fois déverrouillés.
  if (CONFIG_UNLOCK_GESTURE.has(type) || (ctx.unlocked && CONFIG_AFTER_UNLOCK.has(type))) {
    tabs.push('config')
  }

  // Notifications
  if (ctx.unlocked && !ctx.isScale && !NO_DATA_NO_NOTIF.has(type)) tabs.push('notifications')

  // Vue patient puis Sources (en dernier)
  if (hasPreview) {
    tabs.push('preview')
    tabs.push('sources')
  }

  return tabs
}
