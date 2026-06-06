import { daysBetween } from '../../../lib/caseloadLogic'
import type { AlertLevel } from '../../../lib/caseload.types'
import type { StatusBadgeVariant } from '../../ui/StatusBadge/StatusBadge.types'

// Helpers d'AFFICHAGE purs (zéro réseau, zéro i18n) — testables isolément.
// La traduction est faite par le composant à partir du descripteur retourné.

export type DueDescriptor =
  | { kind: 'none' }
  | { kind: 'overdue'; days: number }
  | { kind: 'today' }
  | { kind: 'upcoming'; days: number }

/** Décrit une échéance en délai relatif à aujourd'hui (sans interprétation). */
export function describeDue(dueDate: string | null, today: string): DueDescriptor {
  if (!dueDate) return { kind: 'none' }
  const diff = daysBetween(today, dueDate)
  if (diff < 0) return { kind: 'overdue', days: -diff }
  if (diff === 0) return { kind: 'today' }
  return { kind: 'upcoming', days: diff }
}

/** `YYYY-MM-DD` → `DD/MM/YYYY` (formatage local, sans dérive de fuseau). */
export function formatBirthDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  return d && m && y ? `${d}/${m}/${y}` : iso
}

const ALERT_VARIANT: Record<AlertLevel, StatusBadgeVariant> = {
  critical: 'danger',
  upcoming: 'warning',
  ok: 'success',
}

/** Mappe un niveau d'alerte vers la variante du StatusBadge du design system. */
export function alertVariant(level: AlertLevel): StatusBadgeVariant {
  return ALERT_VARIANT[level]
}
