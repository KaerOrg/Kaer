// Centralized date formatting helpers — all functions use 'fr-FR' locale.
// Inputs that look like bare dates (YYYY-MM-DD) are coerced to local midnight
// so they never shift a day due to UTC parsing.

function localDate(str: string): Date {
  return /^\d{4}-\d{2}-\d{2}$/.test(str) ? new Date(str + 'T00:00:00') : new Date(str)
}

/** jeu. 3 avr. — compact, for list items */
export function formatDateShort(str: string): string {
  return localDate(str).toLocaleDateString('fr-FR', {
    weekday: 'short', day: 'numeric', month: 'short',
  })
}

/** jeu. 3 avr. 2026 — compact with year */
export function formatDateShortYear(str: string): string {
  return new Date(str).toLocaleDateString('fr-FR', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })
}

/** jeu. 3 avril 2026 — for history cards */
export function formatDateLong(str: string): string {
  return new Date(str).toLocaleDateString('fr-FR', {
    weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
  })
}

/** jeudi 3 avril 2026 — for entry-screen headers */
export function formatDateFull(str: string): string {
  return localDate(str).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

/** 03/04/2026 — numeric compact */
export function formatDateNumeric(str: string): string {
  return localDate(str).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

/** jeu. 3 avr. 14:30 — for full ISO timestamps */
export function formatDateTime(str: string): string {
  return new Date(str).toLocaleDateString('fr-FR', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  })
}
