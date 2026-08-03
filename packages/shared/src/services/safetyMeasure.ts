// ─── Étape 6 du plan de sécurité : composer la phrase d'une mesure ───────────
//
// Une mesure de mise à distance se saisit en quatre morceaux (un verbe d'action, quoi,
// qui s'en occupe, jusqu'à quand) et se LIT comme une phrase :
//
//     « Ma mère garde la boîte. · Jusqu'au 12 septembre. »
//
// La phrase est composée AU RENDU, jamais stockée composée. Deux raisons :
//
//  1. Les morceaux restent modifiables un par un. Une phrase figée obligerait à la
//     re-parser pour changer une échéance.
//  2. L'i18n reste possible. C'est aussi pourquoi la maquette « phrase à trous » (5a)
//     a été écartée : la grammaire française y résiste (« ma mère GARDE » mais « je
//     M'ÉLOIGNE »), et chaque langue aurait exigé sa propre mécanique d'accord.
//
// Conformité MDR 2017/745 : aucune date n'est comparée à aujourd'hui. L'échéance est
// AFFICHÉE, jamais surveillée — faire dire à l'app « cette mesure a expiré » serait du
// contenu piloté par une donnée patient. C'est le soignant qui la revoit en consultation.

/** Les quatre morceaux d'une mesure, tels que le patient les a saisis. */
export interface SafetyMeasureParts {
  /** Verbe d'action, choisi parmi les propositions ou écrit librement. */
  readonly verb: string
  /** Ce qui est mis à distance, dans les mots du patient. */
  readonly what: string
  /** Qui s'en occupe. **Facultatif** : s'éloigner n'implique personne d'autre. */
  readonly who?: string | null
  /** Jusqu'à quand : une date, ou une échéance en texte (« mon prochain rendez-vous »). */
  readonly until?: string | null
}

/** Ponctuation de fin ajoutée seulement si l'auteur n'en a pas mis. */
function endWithStop(text: string): string {
  return /[.!?…]$/.test(text) ? text : `${text}.`
}

/**
 * Phrase lisible d'une mesure. Les morceaux absents ne laissent **aucun trou** : une
 * mesure sans « qui » ne doit pas se lire « garde la boîte » avec un blanc devant.
 *
 * Le séparateur d'échéance est un point médian, jamais un tiret long.
 */
export function composeMeasureSentence(parts: SafetyMeasureParts): string {
  const subject = parts.who != null && parts.who.trim() !== '' ? parts.who.trim() : ''
  const verb = parts.verb.trim()
  const what = parts.what.trim()

  // Sans sujet, la phrase commence par le verbe : « M'éloigner un temps de la maison ».
  const core = [subject, verb, what].filter(s => s !== '').join(' ')
  if (core === '') return ''

  const until = parts.until != null && parts.until.trim() !== '' ? parts.until.trim() : ''
  return until === '' ? endWithStop(core) : `${endWithStop(core)} · ${endWithStop(until)}`
}

/**
 * Date métier au format « YYYY-MM-DD », depuis les getters **locaux**.
 *
 * `toISOString()` bascule en UTC : en fuseau positif, minuit local y retombe la veille,
 * et une échéance saisie au 12 septembre s'afficherait au 11. Même raison que
 * `weekDates` — ne jamais formater une date choisie par l'utilisateur autrement.
 */
export function toLocalIsoDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
