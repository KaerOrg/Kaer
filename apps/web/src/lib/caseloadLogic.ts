import type {
  AlertLevel,
  CaseloadAction,
  CaseloadRowData,
  TodayBucket,
  TodayItem,
} from './caseload.types'

// ============================================================
// Logique PURE de la file active (zéro réseau, zéro dépendance Supabase).
// Isolée de la couche données pour être testable sans mock.
// MDR : tri/alerte 100 % mécaniques sur des dates saisies par le praticien,
// aucune interprétation de l'état clinique du patient.
// ============================================================

const DAY_MS = 86_400_000

/** Nombre de jours entiers entre deux dates `YYYY-MM-DD` (cible − référence). */
export function daysBetween(fromISODate: string, toISODate: string): number {
  const from = Date.parse(`${fromISODate}T00:00:00Z`)
  const to = Date.parse(`${toISODate}T00:00:00Z`)
  return Math.round((to - from) / DAY_MS)
}

const ALERT_RANK: Record<AlertLevel, number> = { critical: 0, upcoming: 1, ok: 2 }

/** Niveau d'alerte d'une échéance, dérivé uniquement de la date. Jamais stocké. */
export function computeAlertForDue(dueDate: string | null, today: string): AlertLevel {
  if (!dueDate) return 'ok'
  const daysUntilDue = daysBetween(today, dueDate)
  if (daysUntilDue <= 0) return 'critical'
  if (daysUntilDue <= 7) return 'upcoming'
  return 'ok'
}

/** Alerte d'une action : 'ok' si elle est faite, sinon dérivée de son échéance. */
export function computeActionAlert(
  action: Pick<CaseloadAction, 'due_date' | 'is_done'>,
  today: string
): AlertLevel {
  if (action.is_done) return 'ok'
  return computeAlertForDue(action.due_date, today)
}

const FAR_FUTURE = '9999-12-31'
const FAR_TIME = '99:99'

/** Clé de tri d'une action ouverte : échéance (date puis heure) la plus proche en premier. */
function actionDueKey(action: CaseloadAction): string {
  return `${action.due_date ?? FAR_FUTURE}T${action.due_time ?? FAR_TIME}`
}

function compareOpenActions(a: CaseloadAction, b: CaseloadAction, today: string): number {
  const byAlert = ALERT_RANK[computeActionAlert(a, today)] - ALERT_RANK[computeActionAlert(b, today)]
  if (byAlert !== 0) return byAlert
  const byDue = actionDueKey(a).localeCompare(actionDueKey(b))
  if (byDue !== 0) return byDue
  return a.sort_order - b.sort_order
}

/** L'action ouverte (non faite) la plus urgente d'un dossier, ou null si aucune. */
export function selectTopAction(actions: readonly CaseloadAction[], today: string): CaseloadAction | null {
  let top: CaseloadAction | null = null
  for (const action of actions) {
    if (action.is_done) continue
    if (top === null || compareOpenActions(action, top, today) < 0) top = action
  }
  return top
}

/** Alerte d'un dossier = celle de son action ouverte la plus urgente ('ok' si aucune). */
export function computeEntryAlert(actions: readonly CaseloadAction[], today: string): AlertLevel {
  const top = selectTopAction(actions, today)
  return top ? computeActionAlert(top, today) : 'ok'
}

const BUCKET_ORDER: Record<TodayBucket, number> = { overdue: 0, today: 1, relance: 2, wake: 3 }

function compareTodayItems(a: TodayItem, b: TodayItem): number {
  const byBucket = BUCKET_ORDER[a.bucket] - BUCKET_ORDER[b.bucket]
  if (byBucket !== 0) return byBucket
  const byImportant = Number(b.entry.is_important) - Number(a.entry.is_important)
  if (byImportant !== 0) return byImportant
  const aDue = a.action ? actionDueKey(a.action) : FAR_FUTURE
  const bDue = b.action ? actionDueKey(b.action) : FAR_FUTURE
  return aDue.localeCompare(bDue)
}

/**
 * Construit la liste « Aujourd'hui », tâche par tâche, triée par urgence.
 * - Dossiers actifs : actions ouvertes en retard / échéance du jour + relances dues.
 * - Dossiers en veille : réveils dus (`wake_date` atteint).
 * Chaque item porte la raison mécanique de sa présence.
 */
export function buildTodayList(rows: readonly CaseloadRowData[], today: string): TodayItem[] {
  const items: TodayItem[] = []
  for (const { entry, actions, waits } of rows) {
    if (entry.status === 'active') {
      for (const action of actions) {
        if (action.is_done || !action.due_date) continue
        const diff = daysBetween(today, action.due_date)
        if (diff < 0) items.push({ entry, action, bucket: 'overdue', reason: { kind: 'overdue', days: -diff } })
        else if (diff === 0) items.push({ entry, action, bucket: 'today', reason: { kind: 'due_today' } })
      }
      for (const wait of waits) {
        if (wait.relance_date && daysBetween(today, wait.relance_date) <= 0) {
          items.push({ entry, action: null, bucket: 'relance', reason: { kind: 'relance_due', label: wait.label } })
        }
      }
    } else if (entry.status === 'paused') {
      if (entry.wake_date && daysBetween(today, entry.wake_date) <= 0) {
        items.push({ entry, action: null, bucket: 'wake', reason: { kind: 'wake_due' } })
      }
    }
  }
  return items.sort(compareTodayItems)
}
