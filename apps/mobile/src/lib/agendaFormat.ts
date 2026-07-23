// Formatage d'affichage des rendez-vous — fonctions pures, dépendantes de la locale
// active de l'app (jamais une locale figée). `starts_at` est un horodatage d'événement
// (timestamptz) : le lire avec `new Date(iso)` et les getters locaux est correct — on
// affiche l'instant tel qu'il tombe dans le fuseau de l'appareil.

/**
 * Abréviation du jour de la semaine en MAJUSCULES (ex. « LUN », « VEN »).
 * Le point éventuel des abréviations (« lun. ») est retiré pour la pastille compacte.
 */
export function dayAbbrev(iso: string, locale: string): string {
  const label = new Date(iso).toLocaleDateString(locale, { weekday: 'short' })
  return label.replace(/\.$/, '').toUpperCase()
}

/** Numéro du jour dans le mois (ex. « 16 »). */
export function dayNumber(iso: string): string {
  return String(new Date(iso).getDate())
}

/** Heure au format court de la locale (ex. « 14:30 »). */
export function formatTime(iso: string, locale: string): string {
  return new Date(iso).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
}

/** Date longue lisible : jour abrégé + numéro + mois abrégé (ex. « mer. 16 juil. »). */
export function formatLongDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale, {
    weekday: 'short', day: 'numeric', month: 'short',
  })
}
