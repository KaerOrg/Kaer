// Helpers purs du résumé de suivi (écran Profil patient). Aucune interprétation
// clinique : on formate/compte des faits bruts (MDR 2017/745). `createdAt` est un
// horodatage d'événement (patients.created_at, timestamptz) — le lire avec
// `new Date(iso)` et le formater dans la locale active est correct : on affiche
// l'instant tel qu'il tombe dans le fuseau de l'appareil (cf. lib/agendaFormat).

const MS_PER_DAY = 86_400_000

/**
 * Nombre de jours écoulés depuis l'inscription. Plancher à 0 (une date future,
 * théorique, ne renvoie jamais un négatif). `now` injecté pour la testabilité.
 */
export function trackingDays(createdAtIso: string, now: Date): number {
  const created = new Date(createdAtIso).getTime()
  if (Number.isNaN(created)) return 0
  return Math.max(0, Math.floor((now.getTime() - created) / MS_PER_DAY))
}

/**
 * Mois + année d'inscription dans la locale active (ex. « mars 2025 »,
 * « March 2025 »). Repli sur chaîne vide si la date est absente/invalide —
 * l'appelant décide de masquer la ligne « Suivi depuis … ».
 */
export function formatSince(createdAtIso: string | null, locale: string): string {
  if (!createdAtIso) return ''
  const d = new Date(createdAtIso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString(locale, { month: 'long', year: 'numeric' })
}
