// Rappels locaux du module « Techniques de respiration » (epic #195, M5).
//
// Notifications programmées sur l'appareil, aux jours et à l'heure choisis PAR LE
// PATIENT dans le hub. Opt-in strict : rien n'existe tant qu'il n'a pas créé de
// rappel, et couper la bascule annule réellement ce qui était programmé.
//
// ⚠️ Conformité MDR 2017/745, invariant du rappel neutre. Le contenu du message est
// une CONSTANTE, résolue depuis les locales et jamais interpolée. Il ne dépend
// d'aucune donnée saisie, d'aucun compte de sessions, d'aucun objectif atteint ou
// manqué. Un rappel n'est jamais déclenché par l'état des données : ni « vous n'avez
// pas pratiqué depuis 3 jours », ni « plus qu'une session pour votre objectif ».
// L'objectif hebdomadaire ne pilote jamais les rappels. Ce contrat est verrouillé par
// `apps/mobile/src/__tests__/breathingReminderText.guard.test.ts`.

import * as Notifications from 'expo-notifications'
import { buildReminderPlan, type ReminderSettings } from '../lib/breathingReminderPlan'
import { ensurePermission } from './permissionsService'

/**
 * Marque nos notifications dans le payload. `getAllScheduledNotificationsAsync`
 * renvoie TOUTES les notifications de l'app : sans ce marqueur, annuler les nôtres
 * annulerait aussi celles des autres modules.
 */
const REMINDER_KIND = 'breathing_reminder'

/** Module ouvert par le tap. Le hub, pas une saisie : on propose, on n'impose pas. */
const MODULE_TYPE = 'breathing_techniques'

/** Payload lu par `useNotificationNavigation` pour router le tap. */
const REMINDER_DATA = {
  kind: REMINDER_KIND,
  module_type: MODULE_TYPE,
  screen: 'home',
} as const

/** Ce que l'appelant doit savoir du résultat, pour en informer le patient. */
export type ReminderSyncResult =
  /** Rappels programmés (ou aucun à programmer, ce qui est un succès aussi). */
  | { status: 'scheduled'; count: number }
  /** Le patient a refusé les notifications : le réglage est gardé, rien n'est programmé. */
  | { status: 'permission_denied' }

/** Les notifications de ce module déjà programmées sur l'appareil. */
async function scheduledReminderIds(): Promise<string[]> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync()
  return scheduled
    .filter(item => item.content?.data?.kind === REMINDER_KIND)
    .map(item => item.identifier)
}

/**
 * Annule tous les rappels de ce module. Idempotent : sans rappel programmé, ne fait
 * rien et n'échoue pas.
 */
export async function cancelBreathingReminders(): Promise<void> {
  const ids = await scheduledReminderIds()
  await Promise.all(ids.map(id => Notifications.cancelScheduledNotificationAsync(id)))
}

/**
 * Aligne les notifications de l'appareil sur les réglages du patient.
 *
 * Toujours « annuler puis reprogrammer » : modifier l'heure ou les jours ne peut donc
 * pas laisser de doublon, et couper la bascule se contente de l'annulation.
 *
 * `title` et `body` sont fournis **déjà traduits** par l'appelant : ce service ne
 * connaît aucune clé i18n, et surtout n'a aucun moyen d'y injecter une donnée.
 */
export async function syncBreathingReminders(
  settings: ReminderSettings,
  title: string,
  body: string,
): Promise<ReminderSyncResult> {
  const plan = buildReminderPlan(settings)

  // L'annulation précède tout : c'est elle qui garantit l'absence de doublon, et
  // c'est le seul geste nécessaire quand le patient coupe son rappel.
  await cancelBreathingReminders()
  if (plan.length === 0) return { status: 'scheduled', count: 0 }

  // La permission n'est demandée qu'au moment où un rappel est réellement voulu,
  // jamais à l'ouverture du module.
  if (!(await ensurePermission('notifications'))) return { status: 'permission_denied' }

  await Promise.all(plan.map(occurrence => Notifications.scheduleNotificationAsync({
    content: { title, body, data: REMINDER_DATA },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: occurrence.weekday,
      hour: occurrence.hour,
      minute: occurrence.minute,
    },
  })))

  return { status: 'scheduled', count: plan.length }
}
